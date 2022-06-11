const AuthenticationController = require("./AuthenticationController");
const { User, Role } = require("../models");
const { EmailAlreadyTakenError, EmailNotRegisteredError, InsufficientAccessError, RecordNotFoundError, WrongPasswordError } = require("../errors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

describe("AuthenticationController", () => {
  describe("instantiate AuthenticationController", () => {
    it("should be defined", () => {
      const name = "Malay";
      const email = "email@gmail.com";
      const image = "Malay.jpeg";
      const encryptedPassword = "encryptedPassword";
      const roleId = 1;
      const roleName = "ADMIN";
      const mockUser = new User({ name, email, image, encryptedPassword, roleId });
      const mockRole = new Role({ name: roleName });
      const authentication = new AuthenticationController({
        userModel: mockUser,
        roleModel: mockRole,
        bcrypt,
        jwt,
      });
      expect(authentication).toBeDefined();
      expect(authentication).toHaveProperty("userModel", mockUser);
      expect(authentication).toHaveProperty("roleModel", mockRole);
      expect(authentication).toHaveProperty("bcrypt", bcrypt);
      expect(authentication).toHaveProperty("jwt", jwt);
    });
  });

  describe("authorize", () => {
    it("should return a 401 error if the token is not provided", () => {
      const roleName = "ADMIN";
      const mockRole = new Role({ name: roleName });

      const mockUser = new User({
        id: 1,
        name: "Malay",
        email: "Malay@gmail.com",
        image: "Malay.jpeg",
        encryptedPassword: "encryptedPassword",
        roleId: 1,
      });

      const authentication = new AuthenticationController({
        userModel: mockUser,
        roleModel: mockRole,
        bcrypt,
        jwt,
      });

      const req = {
        headers: {
          authorization: "",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      authentication.authorize(roleName)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          name: "JsonWebTokenError",
          message: "jwt must be provided",
          details: null,
        },
      });
    });

    it("should return a 401 error if the token is malformed", () => {
      const roleName = "ADMIN";
      const mockRole = new Role({ name: roleName });

      const mockUser = new User({
        id: 1,
        name: "Malay",
        email: "Malay@gmail.com",
        image: "Malay.jpeg",
        encryptedPassword: "encryptedPassword",
        roleId: 1,
      });

      const authentication = new AuthenticationController({
        userModel: mockUser,
        roleModel: mockRole,
        bcrypt,
        jwt,
      });

      const req = {
        headers: {
          authorization: "Bearer invalidToken",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      authentication.authorize(roleName)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          name: "JsonWebTokenError",
          message: "jwt malformed",
          details: null,
        },
      });
    });

    it("should return a 401 error if the token is invalid", () => {
      const roleName = "CUSTOMER";
      const mockRole = new Role({ id: 1, name: roleName });

      const mockUser = new User({
        id: 1,
        name: "Malay",
        email: "Malay@gmail.com",
        image: "Malay.jpeg",
        encryptedPassword: "encryptedPassword",
        roleId: 1,
      });

      const authentication = new AuthenticationController({
        userModel: mockUser,
        roleModel: mockRole,
        bcrypt,
        jwt,
      });

      const req = {
        headers: {
          authorization:
            "Bearer yJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IkpvaG5ueSIsImVtYWlsIjoiam9obm55QGJpbmFyLmNvLmlkIiwiaW1hZ2UiOm51bGwsInJvbGUiOnsiaWQiOjEsIm5hbWUiOiJDVVNUT01FUiJ9LCJpYXQiOjE2NTQ1OTI3Nzl9.A1QUdj7kUy6Rfarn4jpy3z0SU6PVS-vJM51rO0I_hIc",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      authentication.authorize(roleName)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          name: "JsonWebTokenError",
          message: "invalid token",
          details: null,
        },
      });
    });

    it("should return 401 if the token role is not same with the required role", () => {
      const roleName = "CUSTOMER";
      const mockRole = new Role({ id: 1, name: roleName });

      const mockUser = new User({
        id: 1,
        name: "Malay",
        email: "ayu@gmail.com",
        image: "Malay.jpeg",
        encryptedPassword: "encryptedPassword",
        roleId: 1,
      });

      const authentication = new AuthenticationController({
        userModel: mockUser,
        roleModel: mockRole,
        bcrypt,
        jwt,
      });

      const req = {
        headers: {
          authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IkpvaG5ueSIsImVtYWlsIjoiam9obm55QGJpbmFyLmNvLmlkIiwiaW1hZ2UiOm51bGwsInJvbGUiOnsiaWQiOjEsIm5hbWUiOiJDVVNUT01FUiJ9LCJpYXQiOjE2NTQ1OTI3Nzl9.A1QUdj7kUy6Rfarn4jpy3z0SU6PVS-vJM51rO0I_hIc",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      authentication.authorize("ADMIN")(req, res, next);

      const err = new InsufficientAccessError(roleName);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          name: err.name,
          message: err.message,
          details: err.details,
        },
      });
    });

    it("should return next if the token role is same with the required role", () => {
      const roleName = "CUSTOMER";
      const mockRole = new Role({ id: 1, name: roleName });

      const mockUser = new User({
        id: 1,
        name: "Malay",
        email: "Malay@gmail.com",
        image: "Malay.jpeg",
        encryptedPassword: "encryptedPassword",
        roleId: 1,
      });

      const authentication = new AuthenticationController({
        userModel: mockUser,
        roleModel: mockRole,
        bcrypt,
        jwt,
      });

      const req = {
        headers: {
          authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IkpvaG5ueSIsImVtYWlsIjoiam9obm55QGJpbmFyLmNvLmlkIiwiaW1hZ2UiOm51bGwsInJvbGUiOnsiaWQiOjEsIm5hbWUiOiJDVVNUT01FUiJ9LCJpYXQiOjE2NTQ1OTI3Nzl9.A1QUdj7kUy6Rfarn4jpy3z0SU6PVS-vJM51rO0I_hIc",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      authentication.authorize(roleName)(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe("handleLogin", () => {
    it("should return a 404 error if the user is not found", async () => {
      const roleName = "ADMIN";

      const mockUserModel = {
        findOne: jest.fn().mockReturnValue(null),
      };

      const mockRole = new Role({ id: 2, name: roleName });

      const req = {
        body: {
          email: "blabla@gmail.com",
          password: "password",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      const authentication = new AuthenticationController({
        userModel: mockUserModel,
        roleModel: mockRole,
        bcrypt,
        jwt,
      });

      const err = new EmailNotRegisteredError(req.body.email);

      await authentication.handleLogin(req, res, next);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        where: { email: req.body.email.toLowerCase() },
        include: [{ model: mockRole, attributes: ["id", "name"] }],
      });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          name: err.name,
          message: err.message,
          details: err.details,
        },
      });
    });

    it("should return a 401 error if the password is incorrect", async () => {
      const roleName = "ADMIN";

      const mockUserModel = {
        findOne: jest.fn().mockReturnValue({
          id: 1,
          name: "Malay",
          email: "Malay@gmail.com",
          image: "Malay.jpeg",
          encryptedPassword: "encryptedPassword",
          roleId: 2,
        }),
      };
      const mockRole = new Role({ id: 2, name: roleName });

      const req = {
        body: {
          email: "Malay@gmail.com",
          password: "password",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      const authentication = new AuthenticationController({
        userModel: mockUserModel,
        roleModel: mockRole,
        bcrypt,
        jwt,
      });

      const err = new WrongPasswordError();

      await authentication.handleLogin(req, res, next);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        where: { email: req.body.email.toLowerCase() },
        include: [{ model: mockRole, attributes: ["id", "name"] }],
      });
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(err);
    });

    it("should return a 201 status and a token if the password is correct", async () => {
      const roleName = "ADMIN";

      const mockRole = new Role({ id: 2, name: roleName });
      const mockUser = new User({
        id: 1,
        name: "Malay",
        email: "Malay@gmail.com",
        image: "Malay.jpeg",
        encryptedPassword: "$2a$10$HOHjm0YoQ7jx7/y2pKTB7.jEc/sadBxY1Ic47bdM.kLoJp3ixVM9O",
        roleId: 2,
      });

      const mockUserModel = {
        findOne: jest.fn().mockReturnValue({
          ...mockUser.dataValues,
          Role: mockRole,
        }),
      };

      const req = {
        body: {
          email: "Malay@gmail.com",
          password: "password",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      const authentication = new AuthenticationController({
        userModel: mockUserModel,
        roleModel: mockRole,
        bcrypt,
        jwt,
      });

      await authentication.handleLogin(req, res, next);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        where: { email: req.body.email.toLowerCase() },
        include: [{ model: mockRole, attributes: ["id", "name"] }],
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        accessToken: expect.any(String),
      });
    });

    it("should return error if the promise is rejected", async () => {
      const roleName = "ADMIN";

      const mockRole = new Role({ id: 2, name: roleName });
      const mockUser = new User({
        id: 1,
        name: "Malay",
        email: "Malay@gmail.com",
        image: "Malay.jpeg",
        encryptedPassword: "$2a$10$HOHjm0YoQ7jx7/y2pKTB7.jEc/sadBxY1Ic47bdM.kLoJp3ixVM9O",
        roleId: 2,
      });

      const mockUserModel = {
        findOne: jest.fn(() => Promise.reject(err)),
      };

      const req = {
        body: {
          email: "Malay@gmail.com",
          password: "password",
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      const authentication = new AuthenticationController({
        userModel: mockUserModel,
        roleModel: mockRole,
        bcrypt,
        jwt,
      });

      await authentication.handleLogin(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("handleRegister", () => {
    it("should return a 422 error if the email is already registered", async () => {
      const mockUser = new User({
        id: 1,
        name: "Malay",
        email: "Malay@gmail.com",
        image: "Malay.jpeg",
        encryptedPassword: "$2a$10$HOHjm0YoQ7jx7/y2pKTB7.jEc/sadBxY1Ic47bdM.kLoJp3ixVM9O",
        roleId: 2,
      });

      const mockUserModel = {
        findOne: jest.fn().mockReturnValue(mockUser),
      };

      const roleName = "CUSTOOMER";
      const mockRole = new Role({ id: 2, name: roleName });

      const req = {
        body: {
          name: "Malay",
          email: "Malay@gmail.com",
          password: "password",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      const authentication = new AuthenticationController({
        userModel: mockUserModel,
        roleModel: mockRole,
        bcrypt,
        jwt,
      });

      const err = new EmailAlreadyTakenError(req.body.email);

      await authentication.handleRegister(req, res, next);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        where: { email: req.body.email.toLowerCase() },
      });
      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          name: err.name,
          message: err.message,
          details: err.details,
        },
      });
    });

    it("should return next if there's rejected promise", async () => {
      const mockUserModel = {
        findOne: jest.fn(() => Promise.reject(err)),
      };

      const roleName = "CUSTOMER";
      const mockRole = new Role({ id: 2, name: roleName });

      const req = {
        body: {
          name: "Malay",
          email: "Malay@gmail.com",
          password: "password",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      const authentication = new AuthenticationController({
        userModel: mockUserModel,
        roleModel: mockRole,
        bcrypt,
        jwt,
      });

      await authentication.handleRegister(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("should return 201 status and a token if it success", async () => {
      const mockUser = new User({
        id: 1,
        name: "Malay",
        email: "Malay@gmail.com",
        image: "Malay.jpeg",
        encryptedPassword: "$2a$10$HOHjm0YoQ7jx7/y2pKTB7.jEc/sadBxY1Ic47bdM.kLoJp3ixVM9O",
        roleId: 2,
      });

      const mockUserModel = {
        findOne: jest.fn().mockReturnValue(null),
        create: jest.fn().mockReturnValue(mockUser),
      };

      const roleName = "CUSTOMER";
      const mockRole = new Role({ id: 2, name: roleName });

      const mockRoleModel = {
        findOne: jest.fn().mockReturnValue(mockRole.name),
      };

      const req = {
        body: {
          name: "Malay",
          email: "Malay@gmail.com",
          password: "password",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      const authentication = new AuthenticationController({
        userModel: mockUserModel,
        roleModel: mockRoleModel,
        bcrypt,
        jwt,
      });

      await authentication.handleRegister(req, res, next);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        where: { email: req.body.email.toLowerCase() },
      });
      expect(mockRoleModel.findOne).toHaveBeenCalledWith({
        where: { name: mockRole.name },
      });
      expect(mockUserModel.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        accessToken: expect.any(String),
      });
    });
  });

  describe("handleGetUser", () => {
    it("should return a 404 status if the user is not found", async () => {
      const mockUser = new User({
        id: 1,
        name: "Malay",
        email: "Malay@gmail.com",
        image: "Malay.jpeg",
        encryptedPassword: "$2a$10$HOHjm0YoQ7jx7/y2pKTB7.jEc/sadBxY1Ic47bdM.kLoJp3ixVM9O",
        roleId: 1,
      });

      const mockUserModel = {
        ...mockUser.dataValues,
        findByPk: jest.fn().mockReturnValue(null),
      };

      const roleName = "CUSTOMER";
      const mockRole = new Role({ id: 1, name: roleName });

      const req = {
        user: {
          id: 1,
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      const authentication = new AuthenticationController({
        userModel: mockUserModel,
        roleModel: mockRole,
        bcrypt,
        jwt,
      });

      const err = new RecordNotFoundError(mockUser.name);

      await authentication.handleGetUser(req, res, next);

      expect(mockUserModel.findByPk).toHaveBeenCalledWith(req.user.id);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(err);
    });

    it("should return a 404 status if the role is not found", async () => {
      const roleName = "CUSTOMER";
      const mockRole = new Role({ id: 1, name: roleName });

      const mockUser = new User({
        id: 1,
        name: "Malay",
        email: "Malay@gmail.com",
        image: "Malay.jpeg",
        encryptedPassword: "$2a$10$HOHjm0YoQ7jx7/y2pKTB7.jEc/sadBxY1Ic47bdM.kLoJp3ixVM9O",
        roleId: 1,
      });

      const mockUserModel = {
        ...mockUser.dataValues,
        findByPk: jest.fn().mockReturnValue(mockUser),
      };

      const mockRoleModel = {
        ...mockRole.dataValues,
        findByPk: jest.fn().mockReturnValue(null),
      };

      const req = {
        user: {
          id: 1,
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      const authentication = new AuthenticationController({
        userModel: mockUserModel,
        roleModel: mockRoleModel,
        bcrypt,
        jwt,
      });

      const err = new RecordNotFoundError(mockRole.name);

      await authentication.handleGetUser(req, res, next);

      expect(mockUserModel.findByPk).toHaveBeenCalledWith(req.user.id);
      expect(mockRoleModel.findByPk).toHaveBeenCalledWith(mockUserModel.roleId);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(err);
    });

    it("should return a 200 status and user if it success", async () => {
      const roleName = "CUSTOMER";
      const mockRole = new Role({ id: 1, name: roleName });

      const mockUser = new User({
        id: 1,
        name: "Malay",
        email: "Malay@gmail.com",
        image: "Malay.jpeg",
        encryptedPassword: "$2a$10$HOHjm0YoQ7jx7/y2pKTB7.jEc/sadBxY1Ic47bdM.kLoJp3ixVM9O",
        roleId: 1,
      });

      const mockUserModel = {
        ...mockUser.dataValues,
        findByPk: jest.fn().mockReturnValue(mockUser),
      };
      const mockRoleModel = {
        ...mockRole.dataValues,
        findByPk: jest.fn().mockReturnValue(mockRole),
      };

      const req = {
        user: {
          id: 1,
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      const authentication = new AuthenticationController({
        userModel: mockUserModel,
        roleModel: mockRoleModel,
        bcrypt,
        jwt,
      });

      await authentication.handleGetUser(req, res, next);

      expect(mockUserModel.findByPk).toHaveBeenCalledWith(req.user.id);
      expect(mockRoleModel.findByPk).toHaveBeenCalledWith(mockUserModel.roleId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });
  });
});
