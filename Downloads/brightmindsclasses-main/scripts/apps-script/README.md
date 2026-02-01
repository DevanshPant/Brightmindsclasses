Apps Script: deploy instructions

1) Open https://script.google.com and create a new project.
2) Copy `Code.gs` content into the project (replace FORM_ID with your form id if needed).
3) Save the project. From the menu, choose "Deploy" → "New deployment".
   - Select "Web app".
   - Execute as: **Me** (so the script can call FormApp).
   - Who has access: **Anyone** (or "Anyone, even anonymous") so the website can POST without signing-in.
4) Click Deploy and copy the **Web app URL** (it looks like `https://script.google.com/macros/s/DEPLOY_ID/exec`).
5) In your site, set the env variable `VITE_APPS_SCRIPT_URL` to that URL before building (Vite env vars use the VITE_ prefix):
   - Example: `VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/DEPLOY_ID/exec`
6) Rebuild your site (e.g., `npm run build`) and deploy. The contact form will now POST to the Apps Script and responses will appear in the Google Form responses automatically.

Security & notes:
- Consider adding a simple secret token: send `token=xxxx` from the site and validate in `doPost` to accept only your site.
- Make sure you set "Execute as" to your account; otherwise FormApp operations will be restricted.
- Apps Script quotas are generally sufficient for contact forms; if you expect significant traffic, use a server or Cloud Function.
