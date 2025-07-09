

import os
import json
from google.cloud import texttospeech_v1beta1 as texttospeech

# Google Cloud Text-to-Speech client
client = texttospeech.TextToSpeechClient()

def generate_audio_for_stories(input_path, output_path, audio_dir):
    # Create the directory for audio files if it doesn't exist
    if not os.path.exists(audio_dir):
        os.makedirs(audio_dir)

    with open(input_path, 'r') as f:
        stories = json.load(f)

    # We'll only process the first two stories as requested
    for story in stories[:5]:
        story_audio_dir = os.path.join(audio_dir, f"story_{story['story_number']}")
        if not os.path.exists(story_audio_dir):
            os.makedirs(story_audio_dir)

        for segment in story['segments']:
            segment_id = segment['segment_id']
            text_to_generate = segment['segment_text']
            audio_file_name = f"segment_{segment_id}.mp3"
            audio_file_path = os.path.join(story_audio_dir, audio_file_name)

            # Initialize audio_path and timestamps for the segment
            segment['audio_path'] = f"/audio/story_{story['story_number']}/{audio_file_name}"
            segment['timestamps'] = []

            # Ensure guided_questions are structured as dictionaries
            if segment.get('guided_questions') and isinstance(segment['guided_questions'][0], str):
                segment['guided_questions'] = [{'text': q, 'audio_path': None, 'timestamps': []} for q in segment['guided_questions']]

            print(f"Processing Story {story['story_number']}, Segment {segment_id}...")

            # Check if audio and timestamps already exist for this segment
            if os.path.exists(audio_file_path) and segment.get('timestamps'): # Check for timestamps as well
                print(f"  -> Audio already exists for Story {story['story_number']}, Segment {segment_id}. Skipping API call.")
                # If skipped, ensure audio_path is correctly set (it was initialized above)
                # No need to update timestamps here as they should be loaded from the existing JSON if present
            else:
                try:
                    # Configure the synthesis request
                    # Construct SSML with <mark> tags for word timing
                    words = text_to_generate.split()
                    ssml_text = "<speak>"
                    for i, word in enumerate(words):
                        # Escape special characters in the word for SSML
                        escaped_word = word.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;").replace("'", "&apos;")
                        ssml_text += f"<mark name=\"word_{i}\"/>{escaped_word} "
                    ssml_text += "</speak>"

                    synthesis_input = texttospeech.SynthesisInput(ssml=ssml_text)

                    # Select the voice parameters
                    # You can customize these (e.g., language_code, name, ssml_gender)
                    voice = texttospeech.VoiceSelectionParams(
                        language_code="en-IN", # Indian English
                        name="en-IN-Standard-A", # A standard female voice
                        ssml_gender=texttospeech.SsmlVoiceGender.FEMALE,
                    )

                    # Select the type of audio file you want returned
                    audio_config = texttospeech.AudioConfig(
                        audio_encoding=texttospeech.AudioEncoding.MP3,
                        speaking_rate=0.9,
                        pitch=-2.0,
                    )

                    request = texttospeech.SynthesizeSpeechRequest(
                        input=synthesis_input,
                        voice=voice,
                        audio_config=audio_config,
                        enable_time_pointing=[texttospeech.SynthesizeSpeechRequest.TimepointType.SSML_MARK]
                    )

                    # Perform the text-to-speech request
                    response = client.synthesize_speech(request=request)

                    # Save the audio content
                    with open(audio_file_path, "wb") as out:
                        out.write(response.audio_content)
                        print(f"  -> Saved audio to {audio_file_path}")

                    # Extract word-level timestamps from timepoints
                    word_timestamps = []
                    # The `words` variable is already defined from the SSML construction
                    # We need to map the timepoints back to the original words
                    # GCP provides timepoints for each mark, which corresponds to the start of our words
                    for i, timepoint in enumerate(response.timepoints):
                        if i < len(words):
                            word_start = timepoint.time_seconds
                            word_end = word_start # Default to start time
                            if i + 1 < len(response.timepoints):
                                # If there's a next word, its start time is our current word's end time
                                word_end = response.timepoints[i+1].time_seconds
                            else:
                                # For the last word, approximate end time (e.g., add 0.2 seconds)
                                word_end = word_start + 0.2
                            
                            word_timestamps.append({
                                "word": words[i],
                                "start": word_start,
                                "end": word_end
                            })

                    segment['timestamps'] = word_timestamps
                    print(f"  -> Updated segment {segment_id} with audio_path: {segment['audio_path']} and timestamps: {len(segment['timestamps'])} entries")

                except Exception as e:
                    print(f"  -> Error generating audio for segment {segment_id}: {e}")
                    segment['audio_path'] = None
                    segment['timestamps'] = []

            # Generate audio for guided questions if they exist
            if segment.get('guided_questions'):
                question_audio_dir = os.path.join(story_audio_dir, f"segment_{segment_id}_questions")
                if not os.path.exists(question_audio_dir):
                    os.makedirs(question_audio_dir)

                for q_idx, question_obj in enumerate(segment['guided_questions']):
                    question_text = question_obj['text']
                    question_audio_file_name = f"question_{q_idx}.mp3"
                    question_audio_file_path = os.path.join(question_audio_dir, question_audio_file_name)

                    # Initialize audio_path and timestamps for the question
                    question_obj['audio_path'] = f"/audio/story_{story['story_number']}/segment_{segment_id}_questions/{question_audio_file_name}"
                    question_obj['timestamps'] = [] # No word-level timestamps for questions for now

                    print(f"  -> Processing Question {q_idx + 1} for Segment {segment_id}...")

                    # Check if audio already exists for this question
                    if os.path.exists(question_audio_file_path):
                        print(f"    -> Audio already exists for Question {q_idx + 1}. Skipping API call.")
                    else:
                        try:
                            # Construct SSML for the question
                            question_ssml_text = f"<speak>{question_text}</speak>"
                            question_synthesis_input = texttospeech.SynthesisInput(ssml=question_ssml_text)

                            question_request = texttospeech.SynthesizeSpeechRequest(
                                input=question_synthesis_input,
                                voice=voice,
                                audio_config=audio_config,
                            )

                            question_response = client.synthesize_speech(request=question_request)

                            with open(question_audio_file_path, "wb") as out:
                                out.write(question_response.audio_content)
                                print(f"    -> Saved audio to {question_audio_file_path}")

                        except Exception as q_e:
                            print(f"    -> Error generating audio for Question {q_idx + 1}: {q_e}")
                            question_obj['audio_path'] = None
                            question_obj['timestamps'] = []

    # Save the updated stories data to a new file
    with open(output_path, 'w') as f:
        json.dump(stories, f, indent=4)
    print(f"\nProcessing complete. Updated story data saved to {output_path}")

if __name__ == '__main__':
    # Note: This script should be run from the 'backend/src' directory
    # Adjust paths if running from a different location
    data_dir = './data'
    public_dir = '../public' # The audio files will be served from here
    input_file = os.path.join(data_dir, 'stories_final.json')
    output_file = os.path.join(data_dir, 'stories_final.json')
    audio_output_dir = os.path.join(public_dir, 'audio')
    generate_audio_for_stories(input_file, output_file, audio_output_dir)

