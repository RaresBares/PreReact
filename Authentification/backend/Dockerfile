FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /auth
ENV PYTHONPATH=/auth

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY .. .

EXPOSE 8081
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8101"]