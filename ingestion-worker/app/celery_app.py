import os

from celery import Celery

RABBITMQ_URL = os.environ.get("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672//")

celery_app = Celery("ingestion_worker", broker=RABBITMQ_URL)

celery_app.conf.update(
    task_default_queue="ingestion",
    task_default_exchange="ingestion",
    task_default_routing_key="ingestion",
    task_serializer="json",
    accept_content=["json"],
    task_track_started=True,
    # Documents can be large; don't ack until the chunk/embed/upsert
    # pipeline actually finishes, so a crashed worker requeues the job.
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)

celery_app.autodiscover_tasks(["app"])
