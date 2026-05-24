import json
import sys

transcript_path = r"C:\Users\gopik\.gemini\antigravity\brain\ed5016b7-66a1-4245-a4ec-5e358585ba32\.system_generated\logs\transcript.jsonl"
output_path = r"c:\Users\gopik\OneDrive\Desktop\sathika\last_msg.txt"

with open(transcript_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

user_msgs = []
for line in lines:
    try:
        data = json.loads(line)
        if data.get("type") == "USER_INPUT":
            user_msgs.append(data.get("content", ""))
    except Exception:
        pass

if user_msgs:
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(user_msgs[-1])
        print("Done. Extracted last user message.")
else:
    print("No user messages found.")
