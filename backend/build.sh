#!/usr/bin/env bash
# Render runs this as the Build Command for the web service.
# Root Directory on Render should be set to `backend`, so paths below are
# relative to backend/ (the frontend lives one level up, as a sibling).
set -o errexit

echo "--- Building frontend ---"
cd ../frontend
npm install
npm run build
cd ../backend

echo "--- Installing Python dependencies ---"
pip install -r requirements.txt

echo "--- Collecting static files ---"
python manage.py collectstatic --noinput

echo "--- Running database migrations ---"
python manage.py migrate
