import os
import json
import requests
import time
import re

# Configuration
OLLAMA_API_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "mistral"
INPUT_JSON_PATH = "stories_final.json"
OUTPUT_JSON_PATH = "stories_final.json" # Update in place

def call_ollama(prompt, model=MODEL_NAME):
    headers = {"Content-Type": "application/json"}
    data = {
        "model": model,
        "prompt": prompt,
        "stream": False, # We want the full response at once
        "format": "json" # Request JSON format directly
    }
    try:
        response = requests.post(OLLAMA_API_URL, headers=headers, json=data)
        response.raise_for_status() # Raise an exception for HTTP errors
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error calling Ollama API: {e}")
        return None

def enrich_story_with_llm(story_data):
    print(f"Enriching Story {story_data['story_number']}: {story_data['title']}")

    # Prompt for Summary and Moral
    summary_moral_prompt = f"""
    You are an expert children's storyteller and educator.
    Given the following story text, provide a concise summary and a clear moral lesson suitable for children aged 4-10.
    Your response MUST be in JSON format.

    Story Title: {story_data['title']}
    Story Text:
    {story_data['full_text']}

    JSON Format Expected:
    ```json
    {{
        "summary": "...",
        "moral": "..."
    }}
    ```
    """
    summary_moral_response = call_ollama(summary_moral_prompt)
    if summary_moral_response and 'response' in summary_moral_response:
        try:
            llm_output = json.loads(summary_moral_response['response'])
            story_data['summary'] = llm_output.get('summary', story_data['summary'])
            story_data['moral'] = llm_output.get('moral', story_data['moral'])
        except json.JSONDecodeError:
            print(f"  Warning: Could not decode JSON for summary/moral for Story {story_data['story_number']}. Raw response: {summary_moral_response['response']}")
    else:
        print(f"  Warning: No valid response for summary/moral for Story {story_data['story_number']}.")

    # Process segments for pause points and guided questions
    for segment in story_data['segments']:
        segment_text = segment['segment_text']
        
        # Prompt for Pause Points and Guided Questions
        # We need to be careful not to generate too many questions for short segments.
        # Let's ask for 1-3 questions if a pause point is identified.
        pause_question_prompt = f"""
        You are an expert children's storyteller and educator.
        Given the following segment of a story, identify if there's a natural pause point suitable for interaction with children aged 4-10.
        If a pause point exists, generate 1-3 engaging guided questions related to that pause point.
        Your response MUST be in JSON format.

        Story Segment:
        {segment_text}

        JSON Format Expected:
        ```json
        {{
            "pause_after": true/false,
            "guided_questions": [
                "Question 1...",
                "Question 2..."
            ]
        }}
        ```
        If no pause point is suitable, set "pause_after" to false and "guided_questions" to an empty array.
        """
        
        pause_question_response = call_ollama(pause_question_prompt)
        if pause_question_response and 'response' in pause_question_response:
            try:
                llm_output = json.loads(pause_question_response['response'])
                segment['pause_after'] = llm_output.get('pause_after', False)
                segment['guided_questions'] = llm_output.get('guided_questions', [])
            except json.JSONDecodeError:
                print(f"  Warning: Could not decode JSON for pause/questions for Segment {segment['segment_id']}. Raw response: {pause_question_response['response']}")
        else:
            print(f"  Warning: No valid response for pause/questions for Segment {segment['segment_id']}.")
        
        time.sleep(0.5) # Small delay to avoid overwhelming Ollama

    return story_data

def main():
    if not os.path.exists(INPUT_JSON_PATH):
        print(f"Error: Input JSON file not found at {INPUT_JSON_PATH}")
        return

    with open(INPUT_JSON_PATH, 'r', encoding='utf-8') as f:
        stories = json.load(f)

    enriched_stories = []
    for story in stories:
        enriched_story = enrich_story_with_llm(story)
        enriched_stories.append(enriched_story)
        time.sleep(1) # Larger delay between stories

    with open(OUTPUT_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(enriched_stories, f, indent=4)
    print(f"\nSuccessfully enriched stories and saved to {OUTPUT_JSON_PATH}")

if __name__ == '__main__':
    main()
