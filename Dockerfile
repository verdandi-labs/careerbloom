FROM node:22 AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/bun.lock ./
RUN npm install
COPY frontend/ .
RUN npm run build

FROM python:3.14-slim
WORKDIR /app
COPY backend/ .
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist
RUN pip install uv && uv sync --frozen
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "10000"]
