# Backend API - Node.js + PostgreSQL

Backend API construido con **Express.js** y **PostgreSQL** con estructura modular y bien organizada.

## 🚀 Características

- ✅ **Express.js** - Framework web rápido y minimalista
- ✅ **PostgreSQL** - Base de datos relacional robusta  
- ✅ **CORS** configurado para desarrollo frontend
- ✅ **Arquitectura modular** - Separación de responsabilidades
- ✅ **Validaciones** - Manejo de errores y respuestas consistentes
- ✅ **Paginación** - Endpoints con paginación incluida

## 📁 Estructura del Proyecto

```
backend/
├── config/          # Configuraciones (DB, CORS)
├── controllers/     # Lógica de negocio
├── middleware/      # Middlewares personalizados  
├── routes/          # Definición de rutas
├── utils/           # Utilidades y helpers
├── index.js         # Archivo principal
└── package.json     # Dependencias y scripts
```

## 🔧 Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone <tu-repo-url>
   cd backend
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar base de datos:**
   - Asegúrate de tener PostgreSQL instalado
   - Crea una base de datos llamada `appdb`
   - Configura las credenciales en `config/database.js`

4. **Ejecutar setup de DB:**
   ```bash
   node setup-db.js
   ```

5. **Iniciar servidor:**
   ```bash
   npm start
   # o
   node index.js
   ```

## 📡 Endpoints API

### 🔍 **Health Check**
```
GET /health - Estado del servidor
```

### 👥 **Usuarios**
```
GET  /api/users?page=1&limit=5  - Listar usuarios (paginado)
POST /api/users                 - Crear nuevo usuario
GET  /api/test                  - Test conexión DB
```

### 📝 **Ejemplo POST - Crear Usuario**
```json
POST /api/users
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com", 
  "password": "password123"
}
```

### 📋 **Respuesta Exitosa**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": 1,
    "name": "john_doe",
    "email": "john@example.com"
  }
}
```

## 🔐 Variables de Entorno

Crea un archivo `.env` (opcional):
```env
DB_USER=admin
DB_HOST=localhost  
DB_NAME=appdb
DB_PASSWORD=admin
DB_PORT=5432
PORT=3001
```

## 🧰 Tecnologías Utilizadas

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web  
- **PostgreSQL** - Base de datos
- **pg** - Cliente PostgreSQL para Node.js
- **cors** - Middleware CORS

## 🚀 Scripts Disponibles

```bash
npm start        # Iniciar servidor
node setup-db.js # Configurar base de datos  
node index.js    # Iniciar servidor directo
```

## 📊 Estructura de Base de Datos

### Tabla `users`
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
);
```

## 🔧 Desarrollo

El servidor corre por defecto en: `http://localhost:3001`

### CORS Configurado para:
- `localhost:3000` (React)
- `localhost:5173` (Vite)  
- `localhost:4200` (Angular)
- `localhost:8080` (Vue)

## 📄 Licencia

MIT License