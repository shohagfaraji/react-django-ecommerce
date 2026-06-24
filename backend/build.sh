#!/usr/bin/env bash
set -o errexit

pip install --upgrade pip
pip install -r requirements.txt
DISABLE_COLLECTSTATIC=1 python manage.py collectstatic --noinput

# Run migrations against the session-mode pooler, not the transaction-mode one
DATABASE_URL=$DIRECT_URL python manage.py migrate