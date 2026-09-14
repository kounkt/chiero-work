# CHIERO consultation website

Current production structure, approved 2026-09-14:

- `/`: shared entry for consulting and coaching.
- `/consulting/`: existing AI / business consulting LP, with shared service header.
- `/coaching/`: coaching LP based on dialogue, questions and flow.
- `assets/services/header.css`: identical header on all three pages; logo links to `https://chiero.jp/`.
- `assets/services/services.js`: service selection and display interactions. Bookings use the existing shared 90-minute application page. The topic is discussed at the start of the session; the external form does not automatically store this selection.
- Existing lead magnets and delivery scheduler are preserved.
- Legacy root fragment URLs route to the corresponding consulting section.

The reviewed hub and coaching mock were promoted by explicit owner instruction. Do not restore a previous single-LP homepage from older project directories or decision documents.

Production is GitHub Pages from `main` at `work.chiero.jp`. No payment or email submission is made by the service UI itself.
