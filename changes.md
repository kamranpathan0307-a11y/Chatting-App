Objective:
Implement a WhatsApp-like media upload and editing system inside an existing chat application.

📌 Core UI Requirement

Add a pin / attachment icon inside the chat input bar.

On tapping the pin icon, open a bottom-sheet style modal with the following options:

Camera

Image Gallery

Video Gallery

Audio (Voice or Audio File)

Documents (PDF, DOCX, etc.)

📌 Media Selection Behavior

Allow users to pick media from:

Device camera

Device gallery

Local storage

Ensure permission handling (camera, microphone, storage).

🖼 Image Editing (WhatsApp-Level)

When the user selects an image, open a full-screen image editor before sending:

Required Image Editor Features

✂ Crop & Rotate

✏ Freehand drawing (with color picker)

📝 Text overlay (change font size & color)

😀 Stickers / Emojis (optional but preferred)

↩ Undo / Redo actions

✔ “Done” button → returns edited image to chat preview

🎥 Video Handling

Allow video selection from camera or gallery

Show video preview before sending

Optional (bonus):

Trim video duration

Add mute/unmute option

🎙 Audio Handling

Support:

Voice recording inside the app

Uploading existing audio files

Show:

Waveform or duration preview

Play / pause before sending

📄 Document Handling

Allow upload of common formats:

PDF, DOCX, PPT, XLS, ZIP

Display:

File name

File size

File type icon

💬 Chat Integration

Media messages should appear as:

Image thumbnails

Video player with play button

Audio player bubble

Document card

Show:

Upload progress

Retry on failure

Sent / Delivered / Read status

⚙ Backend & Storage Expectations

Upload media asynchronously

Use signed URLs or resumable uploads

Compress images/videos before upload

Store metadata:

Type, size, duration, dimensions

Ensure real-time delivery via WebSockets / Socket.io

🎯 Quality Benchmarks

UX and flow must closely resemble WhatsApp

Smooth animations and gestures

Low latency uploads

Mobile-first performance optimization