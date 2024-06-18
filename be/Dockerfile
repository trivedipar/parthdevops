#FROM python:3.6.6-alpine
#FROM python:3-slim
FROM python:3.9-slim-buster
WORKDIR /app
ADD . .
#RUN apk update
RUN apt-get update
RUN pip3 install -r requirements.txt

# run as non-root user
RUN adduser --disabled-password myuser
USER myuser

# Set Flask to run in production mode
# To run Flask in development mode, 
# set FLASK_ENV=development
ENV FLASK_ENV=production

# Set the MongoDB url
ARG DATABASE_URL
ENV DATABASE_URL $DATABASE_URL


# run gunicorn with 3 threads listening on port 5000.
EXPOSE 5000
CMD gunicorn --threads=3 --bind 0.0.0.0:5000 wsgi:app
