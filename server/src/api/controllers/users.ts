import express from 'express';
import mongoose from 'mongoose';
import { container } from 'tsyringe';
import { UserService } from '@services';
import {
  ModelNotFoundError,
  BadRequestError,
  InternalServerError,
  UnauthorizedError,
} from '@errors';
import { IUserLoginDTO, IUserSignupDTO } from '@interfaces';

const route = express.Router();

export const users = (app: express.Router) => {
  app.use('/user', route);
  const userService = container.resolve(UserService);

  route.get('/getActiveUser', async (req, res, next) => {
    try {
      const userId = req.session.userId;

      if (!userId) {
        throw new UnauthorizedError('User not logged in');
      }

      const user = await userService.getById(
        new mongoose.Types.ObjectId(userId)
      );

      if (!user) {
        throw new ModelNotFoundError('User not found');
      }

      return res.json({
        user,
      });
    } catch (err) {
      next(err);
    }
  });

  route.get('/:id', async (req, res, next) => {
    try {
      const id = req.params.id;
      if (!mongoose.isValidObjectId(id)) {
        throw new BadRequestError(`${id} is not a valid ObjectId`);
      }

      const user = await userService.getById(new mongoose.Types.ObjectId(id));
      if (!user) {
        throw new ModelNotFoundError('User not found');
      }
      return res.json({
        user,
      });
    } catch (err) {
      next(err);
    }
  });

  route.post('/signup', async (req, res, next) => {
    try {
      const userSignup: IUserSignupDTO = req.body.userSignup;
      const { user, error } = await userService.signup(userSignup);

      if (error) {
        throw new BadRequestError(error);
      } else if (!user) {
        throw new InternalServerError('User could not be created');
      }

      return res.json({ user });
    } catch (err) {
      next(err);
    }
  });

  route.post('/login', async (req, res, next) => {
    try {
      const userLogin: IUserLoginDTO = req.body.userLogin;
      const { user, error } = await userService.login(userLogin);

      if (error) {
        throw new BadRequestError(error);
      } else if (!user) {
        throw new InternalServerError('Could not log in user');
      }

      req.session.userId = user._id.toString();
      return res.json({ user });
    } catch (err) {
      next(err);
    }
  });

  route.post('/logout', async (req, res, next) => {
    try {
      req.session.destroy(() => {
        res.redirect('/');
      });
    } catch (err) {
      next(err);
    }
  });
};