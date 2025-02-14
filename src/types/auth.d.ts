declare global {
    interface JwtPayload {
      userId: string;
      iat: number;
      exp: number;
    }
    
    interface LoginForm {
      email: string;
      password: string;
    }
  
    interface RegisterForm extends LoginForm {
      firstName: string;
    }
  }
  