export class InternalServerError extends Error {
  constructor({ cause, statusCode }) {
    super('Ocorreu um erro não esperado', { cause });
    this.name = 'InternalServerError';
    this.action = 'Entre em contato com o suporte';
    this.statusCode = statusCode || 500;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      statusCode: this.statusCode,
    };
  }
}

export class ServiceError extends Error {
  constructor({ cause, message }) {
    super(message || 'Serviço indisponível no momento.', { cause });
    this.name = 'ServiceError';
    this.action = 'Verifique se o serviço está disponível e tente novamente';
    this.statusCode = 503;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      statusCode: this.statusCode,
    };
  }
}

export class ValidationError extends Error {
  constructor({ cause, message, action }) {
    super(message || 'Erro de validação.', { cause });
    this.name = 'ValidationError';
    this.action = action || 'Ajuste os dados enviados e tente novamente.';
    this.statusCode = 400;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      statusCode: this.statusCode,
    };
  }
}

export class NotFoundError extends Error {
  constructor({ cause, message, action }) {
    super(message || 'Erro de validação.', { cause });
    this.name = 'NotFoundError';
    this.action = action || 'Verifique se os parâmetros enviados estão corretos';
    this.statusCode = 404;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      statusCode: this.statusCode,
    };
  }
}

export class MethodNotAllowedError extends Error {
  constructor() {
    super('Método não permitido para este endpoint.');
    this.name = 'MethodNotAllowedError';
    this.action = 'Verifique se o método HTTP utilizado é suportado pela rota';
    this.statusCode = 405;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      statusCode: this.statusCode,
    };
  }
}

export class UnauthorizedError extends Error {
  constructor({ cause, message, action }) {
    super(message || 'Não autenticado.', { cause });
    this.name = 'UnauthorizedError';
    this.action = action || 'Verifique suas credenciais e tente novamente.';
    this.statusCode = 401;
  }
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      statusCode: this.statusCode,
    };
  }
}
