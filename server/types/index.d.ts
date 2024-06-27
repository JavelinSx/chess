import { IUser } from '../../models/User'; // Путь к вашей модели пользователя

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
