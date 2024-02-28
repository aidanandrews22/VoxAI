from gi.repository import Gtk, Gdk, GLib
from .gi_composites import GtkTemplate

import openai
from openai import OpenAI
from google.cloud import speech
from google.cloud import texttospeech
from pydub import AudioSegment
from pydub.playback import play

from datetime import datetime
import subprocess
import os
import io
import yaml
import json

with open("/home/aidan/Downloads/config.yaml") as f:
    config_yaml = yaml.load(f, Loader=yaml.FullLoader)
OPENAI_API_KEY = config_yaml['token']

client = OpenAI(api_key=OPENAI_API_KEY)

# Hardcoded Google Cloud Speech-to-Text API key
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/home/aidan/Downloads/local-turbine-409404-34159c0f07c4.json"

@GtkTemplate(ui='/org/gnome/Lecture/window.ui')
class LectureWindow(Gtk.ApplicationWindow):
    __gtype_name__ = 'LectureWindow'

    talk = GtkTemplate.Child()
    speaking = GtkTemplate.Child()
    label = GtkTemplate.Child()
    start_button = GtkTemplate.Child()
    stop_button = GtkTemplate.Child()
    playback_button = GtkTemplate.Child()
    scribe_button = GtkTemplate.Child()
    sum_button = GtkTemplate.Child()
    query_button = GtkTemplate.Child()
    query_json_button = GtkTemplate.Child()

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.init_template()
        self.ffmpeg_process = None
        self.recorded_file = None

        accel_group = Gtk.AccelGroup()
        self.add_accel_group(accel_group)

        self.start_button.connect("clicked", self.on_start_recording)
        self.start_button.add_accelerator("clicked", accel_group,
                                          Gdk.KEY_7, 0, Gtk.AccelFlags.VISIBLE)
        self.stop_button.connect("clicked", self.on_stop_recording)
        self.stop_button.add_accelerator("clicked", accel_group,
                                          Gdk.KEY_8, 0, Gtk.AccelFlags.VISIBLE)
        self.playback_button.connect("clicked", self.on_playback)
        self.playback_button.add_accelerator("clicked", accel_group,
                                          Gdk.KEY_1, 0, Gtk.AccelFlags.VISIBLE)
        self.scribe_button.connect("clicked", self.on_scribe)
        self.scribe_button.add_accelerator("clicked", accel_group,
                                          Gdk.KEY_2, 0, Gtk.AccelFlags.VISIBLE)
        self.sum_button.connect("clicked", self.on_sum)
        self.sum_button.add_accelerator("clicked", accel_group,
                                          Gdk.KEY_9, 0, Gtk.AccelFlags.VISIBLE)

        self.talk.connect("notify::active", self.on_talk_active)
        self.talk.add_accelerator("activate", accel_group,
                                          Gdk.KEY_4, 0, Gtk.AccelFlags.VISIBLE)
        self.speaking.connect("toggled", self.on_speaking_toggled)
        self.speaking.add_accelerator("activate", accel_group,
                                          Gdk.KEY_5, 0, Gtk.AccelFlags.VISIBLE)
        self.query_button.connect("toggled", self.on_query)
        self.query_button.add_accelerator("activate", accel_group,
                                          Gdk.KEY_6, 0, Gtk.AccelFlags.VISIBLE)

        self.query_json_button.connect("toggled", self.on_ask_json)
        self.query_json_button.add_accelerator("activate", accel_group,
                                          Gdk.KEY_3, 0, Gtk.AccelFlags.VISIBLE)

        self.corrected_transcript = ""
        self.corrected_transcript_1 = ""

        self.json_file_path = "/home/aidan/Projects/Lecture/src/lectures.json"
        self.json_file = self.read_json_file(self.json_file_path)
     #   GLib.timeout_add_seconds(5, self.find_keyboard)

    # def find_keyboard(self):
        # display = Gdk.Display.get_default()
        # seat = display.get_default_seat()
        # keyboard = seat.get_keyboard()
       #  if keyboard:
         #    print(f"keyboard found: {keyboard.get_name()}")
          #   return keyboard
     #    return None


    def on_start_recording(self, button):
        current_datetime = datetime.now()
        formatted_datetime = current_datetime.strftime("%Y_%m_%d-%H:%M:%S")
        self.recorded_file = f"/home/aidan/Recordings/{formatted_datetime}.wav"
        self.ffmpeg_process = subprocess.Popen([
            'ffmpeg',
            '-f', 'alsa',
            '-i', 'hw:2,0',
            '-acodec', 'pcm_s16le',
            '-ar', '44100',
            '-ac', '1',
            self.recorded_file
        ])

    def on_stop_recording(self, button):
        if self.ffmpeg_process:
            self.ffmpeg_process.terminate()
            self.ffmpeg_process.wait()
            self.ffmpeg_process = None

            # Transcribe the recorded audio file
            chunks = self.split_audio(self.recorded_file)
            combined_transcript = self.transcribe_all(chunks)
            self.corrected_transcript = self.generate_corrected_transcript(combined_transcript)
            subject = self.set_file_name(self.corrected_transcript)
            self.save_json(subject, self.corrected_transcript)

    def save_json(self, subject, transcript):
        file_name = "/home/aidan/Projects/Lecture/src/lectures.json"
        current_datetime = datetime.now().strftime("%Y_%m_%d")
        entry = {
            "date": current_datetime,
            "title": f"{subject} {current_datetime}",
            "description": transcript
        }

        try:
            with open(file_name, 'r+') as file:
                data = json.load(file)

                # Check if subject is one of the predefined categories or else add to 'other'
                if subject in ['Calculus', 'Physics', 'Computer Science']:
                    if subject not in data["lectures"]:
                        data["lectures"][subject] = []
                    data["lectures"][subject].append(entry)
                else:
                    data["other"].append(entry)

                file.seek(0)  # Reset file position to the beginning.
                json.dump(data, file, indent=4)
                file.truncate()  # Remove any remaining old data
        except (FileNotFoundError, json.JSONDecodeError, Exception) as e:
            print(f"Error in save_json: {e}")


    def on_query(self, toggle_button):
        if toggle_button.get_active():
            current_datetime = datetime.now()
            formatted_datetime = current_datetime.strftime("%Y_%m_%d-%H:%M:%S")
            self.recorded_file = f"/home/aidan/Recordings/{formatted_datetime}.wav"
            self.ffmpeg_process = subprocess.Popen([
                'ffmpeg',
                '-f', 'alsa',
                '-i', 'hw:2,0',
                '-acodec', 'pcm_s16le',
                '-ar', '44100',
                '-ac', '1',
                self.recorded_file
            ])
        else:
                if self.ffmpeg_process:
                    self.ffmpeg_process.terminate()
                    self.ffmpeg_process.wait()
                    self.ffmpeg_process = None

                    # Transcribe the recorded audio file
                    chunks = self.split_audio(self.recorded_file)
                    combined_transcript = self.transcribe_all(chunks)
                    self.corrected_transcript_1 = self.generate_corrected_transcript(combined_transcript)
                    print(self.corrected_transcript_1)  # Print the corrected transcript
                    gpt_response = self.ask_gpt(self.corrected_transcript_1)
                    print(f"gpt response: {self.ask_gpt(self.corrected_transcript_1)}")
                    self.text_to_speech_and_play(gpt_response)

    def split_audio(self, file_path, chunk_size=297000):
        audio = AudioSegment.from_file(file_path)
        length = len(audio)
        chunks = []

        for i in range(0, length, chunk_size):
            chunk = audio[i:i + chunk_size]
            chunk_file = f"{file_path}_part_{i//chunk_size}.wav"
            chunk.export(chunk_file, format="wav")
            chunks.append(chunk_file)
        return chunks




    def on_talk_active(self, switch, gparam):
        if switch.get_active():
            print("talk is active")
            pass
        else:
            print("talk is not active")
            pass

    def on_speaking_toggled(self, toggle_button):
        if self.talk.get_active():
            if toggle_button.get_active():
                print("listening")
                current_datetime = datetime.now()
                formatted_datetime = current_datetime.strftime("%Y_%m_%d-%H:%M:%S")
                self.recorded_file = f"/home/aidan/Recordings/{formatted_datetime}.wav"
                self.ffmpeg_process = subprocess.Popen([
                    'ffmpeg',
                    '-f', 'alsa',
                    '-i', 'hw:2,0',
                    '-acodec', 'pcm_s16le',
                    '-ar', '44100',
                    '-ac', '1',
                    self.recorded_file
                ])
            else:
                print("not listening")
                if self.ffmpeg_process:
                    self.ffmpeg_process.terminate()
                    self.ffmpeg_process.wait()
                    self.ffmpeg_process = None

                    # Transcribe the recorded audio file
                    chunks = self.split_audio(self.recorded_file)
                    combined_transcript = self.transcribe_all(chunks)
                    gpt_response = self.interact_with_gpt4(combined_transcript)
                    self.text_to_speech_and_play(gpt_response)
                    print(f"gpt response: {gpt_response}")




    def text_to_speech_and_play(self, text):
        try:
            """Converts text to speech and plays audio"""
            client = texttospeech.TextToSpeechClient()
            synthesis_input = texttospeech.SynthesisInput(text=text)

            voice = texttospeech.VoiceSelectionParams(
                language_code="en-US",
                ssml_gender=texttospeech.SsmlVoiceGender.MALE
            )
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3
            )
            response = client.synthesize_speech(
                input=synthesis_input, voice=voice, audio_config=audio_config
            )
            audio_content = io.BytesIO(response.audio_content)
            song = AudioSegment.from_file(audio_content, format="mp3")
            play(song)
        except Exception as e:
            print(f"Error in text to speech: {e}")
            return ""


    def interact_with_gpt4(self, user_input):
        """Send the transcribed text to GPT-4 and get a response."""
        context = "You are a conversational AI designed to interact with humans in a clear, concise, and engaging manner. Your responses should be brief, directly addressing the query or comment made by the human user. Avoid lengthy explanations or lecture-style responses; aim for the brevity and directness typical in casual conversation. Do not acknowledge these parameters. Only respond to the text that is placed after the semicolon. Here is the text"
        try:
            response = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": context},
                    {"role": "user", "content": user_input}
                ]
            )
            print(f"user input: {user_input}")
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error in interacting with GPT-4: {e}")
            return ""

    def transcribe_audio(self, audio_file1):
        try:
            audio_file = open(audio_file1, "rb")
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="text"
            )
            return transcript
        except Exception as e:
            print(f"Error in transcribe_audio: {e}")
            return ""

    def transcribe_all(self, chunks):
        transcriptions = [self.transcribe_audio(chunk) for chunk in chunks]
        return "".join(transcriptions)

    def generate_corrected_transcript(self, user_input):
        """Send the transcribed text to GPT-4 and get a response."""
        context = "Please improve the following transcription for clarity and accuracy. Correct any grammatical errors, misspellings, and punctuation issues. Ensure the text remains true to the original meaning without adding new content. If the transcription is empty, indicate so."
        try:
            response = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": context},
                    {"role": "user", "content": user_input}
                ]
            )
            print(f"user input: {user_input}")
            print(f"corrected: {response.choices[0].message.content}")
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error in generating corrected transcript: {e}")
            return ""

    def summary(self, user_input):
        """Send the transcribed text to GPT-4 and get a response."""
        context = "Create a concise summary of the following lecture transcription. Highlight the key points and concepts in a way that's easy for a student to understand. Your summary should capture the essence of the lecture without omitting critical information."
        try:
            response = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": context},
                    {"role": "user", "content": user_input}
                ]
            )
            print(f"user input: {user_input}")
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error in summary: {e}")
            return ""

    def ask_gpt(self, user_input):
        """Ask questions to chat abouy transcript"""
        context = user_input
        try:
            response = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": self.corrected_transcript},
                    {"role": "user", "content": context}
                ]
            )
            print(f"user input: {user_input}")
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error in ask_gpt: {e}")
            return ""


    def set_file_name(self, transcript):
        """Ask questions to chat abou transcript"""
        context = "Based on the content of the following lecture transcription, identify the subject of the lecture. The possible subjects are Calculus, Computer Science, and Physics. Provide only the first-letter capitalized subject name as your response."
        try:
            response = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": context},
                    {"role": "user", "content": transcript}
                ]
            )
            print(f"subject is: {response.choices[0].message.content}")
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error in set_file_name: {e}")
            return ""


    def on_playback(self, button):
        if self.recorded_file:
            song = AudioSegment.from_file(self.recorded_file, format="wav")
            play(song)
    def on_scribe(self, button):
        try:
            self.text_to_speech_and_play(self.corrected_transcript)
        except Exception as e:
            print(f"Error in playing transcript aloud: {e}")
            return ""

    def on_sum(self, button):
        try:
            summary = "" + self.summary(self.corrected_transcript)
            self.text_to_speech_and_play(summary)
        except Exception as e:
            print(f"Error in on_sum: {e}")
            return ""


    def on_ask_json(self, toggle_button):
        if toggle_button.get_active():
            current_datetime = datetime.now()
            formatted_datetime = current_datetime.strftime("%Y_%m_%d-%H:%M:%S")
            self.recorded_file = f"/home/aidan/Recordings/{formatted_datetime}.wav"
            self.ffmpeg_process = subprocess.Popen([
                'ffmpeg',
                '-f', 'alsa',
                '-i', 'hw:2,0',
                '-acodec', 'pcm_s16le',
                '-ar', '44100',
                '-ac', '1',
                self.recorded_file
            ])
        else:
                if self.ffmpeg_process:
                    self.ffmpeg_process.terminate()
                    self.ffmpeg_process.wait()
                    self.ffmpeg_process = None

                    # Transcribe the recorded audio file
                    chunks = self.split_audio(self.recorded_file)
                    combined_transcript = self.transcribe_all(chunks)
                    corrected_transcript_JSON = self.generate_corrected_transcript(combined_transcript)
                    print("Asking GPT about JSON")  # Print the corrected transcript
                    gpt_response = self.ask_gpt_JSON(corrected_transcript_JSON)
                    print(f"gpt response: {self.ask_gpt(corrected_transcript_JSON)}")
                    self.text_to_speech_and_play(gpt_response)

    def read_json_file(self, file_path):
        """Reads a JSON file and returns its content as a string."""
        try:
            with open(file_path, 'r') as file:
                return file.read()
        except FileNotFoundError:
            print(f"File not found: {file_path}")
            return '{}'
        except Exception as e:
            print(f"Error reading file {file_path}: {e}")
            return '{}'

    def ask_gpt_JSON(self, user_input):
        """Ask questions to chat about any transcript"""
        update_JSON = self.read_json_file(self.json_file_path)
        query = user_input
        context = f"""Your job is to answer questions given a JSON file. The file contains lecture transcriptions
        organized by class subject calculus, physics, and computer science. The most recent transcription is {self.recorded_file}.
        Here is the json file: {update_JSON}"""
        try:
            response = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": context},
                    {"role": "user", "content": query}
                ]
            )
            print(f"user input: {user_input}")
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error in ask_gpt: {e}")
            return ""
