import json
import re
import os

def process_stories_from_text(input_txt_path, output_json_path):
    with open(input_txt_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split the content into individual stories
    # Use a regex to find story headers and split, keeping the headers
    story_pattern = re.compile(r'(Story \d+ : .*\n-{10,})', re.MULTILINE)
    parts = story_pattern.split(content)

    stories_raw_data = []
    current_story_header = None
    current_story_text = []

    # Iterate through parts to reconstruct stories
    for part in parts:
        if story_pattern.fullmatch(part): # It's a story header
            if current_story_header: # Save previous story if exists
                stories_raw_data.append({
                    "header": current_story_header,
                    "text": "".join(current_story_text).strip()
                })
            current_story_header = part.strip()
            current_story_text = []
        else: # It's story content
            current_story_text.append(part)

    # Add the last story
    if current_story_header:
        stories_raw_data.append({
            "header": current_story_header,
            "text": "".join(current_story_text).strip()
        })

    final_stories = []
    for idx, story_raw in enumerate(stories_raw_data):
        # Extract story number and title from header
        header_lines = story_raw["header"].split('\n')
        title_line = header_lines[0]
        match = re.match(r'Story (\d+) : (.*)', title_line)
        if not match:
            continue # Skip if header doesn't match expected format

        story_number = int(match.group(1))
        title = match.group(2).strip()

        full_text = story_raw["text"].strip()

        # Simple paragraph-based segmentation
        paragraphs = [p.strip() for p in full_text.split('\n') if p.strip()]
        segments = []
        segment_id_counter = 1
        for para in paragraphs:
            segments.append({
                "segment_id": segment_id_counter,
                "segment_text": para,
                "pause_after": False, # Placeholder
                "guided_questions": [] # Placeholder
            })
            segment_id_counter += 1

        final_stories.append({
            "story_number": story_number,
            "title": title,
            "full_text": full_text,
            "summary": full_text[:200] + "..." if len(full_text) > 200 else full_text, # Simple summary
            "moral": "Moral to be generated later.", # Placeholder
            "segments": segments
        })

    with open(output_json_path, 'w', encoding='utf-8') as f:
        json.dump(final_stories, f, indent=4)

if __name__ == '__main__':
    input_txt_file = '../../../Book 1_Mitra-bheda_The Separation of Friends.txt' # Relative to backend/src/data
    output_json_file = 'stories_final.json'
    process_stories_from_text(input_txt_file, output_json_file)
