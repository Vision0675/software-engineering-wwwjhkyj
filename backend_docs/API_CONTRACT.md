# Gongji Campus - Backend API Contract

This document defines the standard backend system architecture and API rules for the Gongji Campus platform.

## 1. Global Standards

### 1.1 Base URL
* **Development Environment:** `http://localhost:8080/api/v1`
* **Production Environment:** `https://api.gongji.edu.cn/api/v1`

### 1.2 Common Headers
* `Content-Type: application/json`
* `Authorization: Bearer <Token>` 

### 1.3 Standard Response Format
All APIs will return data in the following JSON format:
```json
{
  "code": 20000, 
  "message": "success",
  "data": {} 
}
