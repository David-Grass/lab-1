declare global {
  namespace Express {
    interface Request {
      demoUser?: {
        id: number;
      };
    }
  }
}

export {};
