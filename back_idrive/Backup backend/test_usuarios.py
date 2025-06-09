# test_usuarios.py
import pytest
from fastapi.testclient import TestClient
from main import iDriveApp

client = TestClient(iDriveApp)

def test_crear_usuario():
    usuario_data = {
        "nombre": "Test User",
        "correo_electronico": "test@example.com",
        "telefono": "1234567890",
        "cedula": "12345678",
        "password": "TestPass123",
        "id_rol": 1
    }
    response = client.post("/Crear_usuario/", json=usuario_data)
    assert response.status_code == 201
    assert response.json()["message"] == "Usuario creado correctamente"

def test_login_valido():
    login_data = {
        "correo_electronico": "test@example.com",
        "password": "TestPass123"
    }
    response = client.post("/Validacion_Login/", json=login_data)
    assert response.status_code == 200
    assert "message" in response.json()