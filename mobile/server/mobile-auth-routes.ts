import { Router, Request, Response } from "express";
import * as authDb from "./mobile-auth-db";
import * as jwt from "./mobile-jwt";

export const mobileAuthRouter = Router();

// POST /api/mobile/auth/login
mobileAuthRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email e senha são obrigatórios",
      });
    }

    // Buscar usuário por email
    const user = await authDb.getMobileUserByEmail(email);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Credenciais inválidas",
      });
    }

    // Verificar se usuário está ativo
    if (user.active !== 1) {
      return res.status(403).json({
        success: false,
        error: "Usuário inativo. Entre em contato com o administrador.",
      });
    }

    // Verificar senha
    const isPasswordValid = await authDb.verifyPassword(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Credenciais inválidas",
      });
    }

    // Gerar tokens
    const accessToken = jwt.generateAccessToken(user.id, user.email, user.role);
    const refreshToken = jwt.generateRefreshToken(user.id, user.email, user.role);

    // Calcular datas de expiração
    const accessTokenExpires = new Date();
    accessTokenExpires.setMinutes(accessTokenExpires.getMinutes() + 15);
    
    const refreshTokenExpires = new Date();
    refreshTokenExpires.setDate(refreshTokenExpires.getDate() + 7);

    // Salvar sessão no banco
    await authDb.createMobileSession({
      userId: user.id,
      accessToken,
      refreshToken,
      expiresAt: accessTokenExpires,
      refreshExpiresAt: refreshTokenExpires,
      deviceInfo: JSON.stringify({
        userAgent: req.headers["user-agent"],
        ip: req.ip,
      }),
    });

    // Atualizar último login
    await authDb.updateMobileUserLastLogin(user.id);

    // Registrar atividade
    await authDb.logMobileActivity({
      userId: user.id,
      action: "login",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        expiresAt: accessTokenExpires.getTime(),
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
});

// POST /api/mobile/auth/refresh
mobileAuthRouter.post("/refresh", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: "Refresh token é obrigatório",
      });
    }

    // Verificar refresh token
    const payload = jwt.verifyRefreshToken(refreshToken);
    
    if (!payload) {
      return res.status(401).json({
        success: false,
        error: "Refresh token inválido ou expirado",
      });
    }

    // Buscar sessão no banco
    const session = await authDb.getMobileSessionByRefreshToken(refreshToken);
    
    if (!session) {
      return res.status(401).json({
        success: false,
        error: "Sessão não encontrada",
      });
    }

    // Verificar se refresh token expirou
    if (new Date() > new Date(session.refreshExpiresAt)) {
      await authDb.deleteMobileSession(session.id);
      return res.status(401).json({
        success: false,
        error: "Sessão expirada. Faça login novamente.",
      });
    }

    // Buscar usuário
    const user = await authDb.getMobileUserById(payload.userId);
    
    if (!user || user.active !== 1) {
      return res.status(403).json({
        success: false,
        error: "Usuário inativo ou não encontrado",
      });
    }

    // Gerar novo access token
    const newAccessToken = jwt.generateAccessToken(user.id, user.email, user.role);
    const accessTokenExpires = new Date();
    accessTokenExpires.setMinutes(accessTokenExpires.getMinutes() + 15);

    // Atualizar sessão
    await authDb.updateMobileSessionActivity(session.id);

    return res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        expiresAt: accessTokenExpires.getTime(),
      },
    });
  } catch (error) {
    console.error("Refresh error:", error);
    return res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
});

// POST /api/mobile/auth/logout
mobileAuthRouter.post("/logout", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Token não fornecido",
      });
    }

    const token = authHeader.substring(7);
    const payload = jwt.verifyAccessToken(token);
    
    if (!payload) {
      return res.status(401).json({
        success: false,
        error: "Token inválido",
      });
    }

    // Buscar e deletar sessão
    const session = await authDb.getMobileSessionByAccessToken(token);
    if (session) {
      await authDb.deleteMobileSession(session.id);
      
      // Registrar atividade
      await authDb.logMobileActivity({
        userId: payload.userId,
        action: "logout",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });
    }

    return res.json({
      success: true,
      message: "Logout realizado com sucesso",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
});

// GET /api/mobile/auth/me
mobileAuthRouter.get("/me", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Token não fornecido",
      });
    }

    const token = authHeader.substring(7);
    const payload = jwt.verifyAccessToken(token);
    
    if (!payload) {
      return res.status(401).json({
        success: false,
        error: "Token inválido",
      });
    }

    // Buscar usuário
    const user = await authDb.getMobileUserById(payload.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Usuário não encontrado",
      });
    }

    return res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
});

// Middleware para validar token de acesso
export async function validateAccessToken(req: Request, res: Response, next: Function) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Token não fornecido",
      });
    }

    const token = authHeader.substring(7);
    const payload = jwt.verifyAccessToken(token);
    
    if (!payload) {
      return res.status(401).json({
        success: false,
        error: "Token inválido ou expirado",
      });
    }

    // Buscar usuário
    const user = await authDb.getMobileUserById(payload.userId);
    
    if (!user || user.active !== 1) {
      return res.status(403).json({
        success: false,
        error: "Usuário inativo ou não encontrado",
      });
    }

    // Adicionar usuário ao request
    (req as any).user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("Token validation error:", error);
    return res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
}
