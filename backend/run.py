if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",  # Change if your module path is different
        host="127.0.0.1",
        port=8000,
        reload=True,
    )