#!/usr/bin/env bash
set -o errexit

pip install --upgrade pip
pip install -r requirements.txt
DISABLE_COLLECTSTATIC=1 python manage.py collectstatic --noinput
python manage.py migrate