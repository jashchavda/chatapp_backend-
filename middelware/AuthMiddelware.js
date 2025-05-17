import jwt from "jsonwebtoken";

export const verifyToken = async (req, res, next) => {
  try {
    // Retrieve the JWT from cookies
    const token = req.cookies.jwt;

    // Check if token exists, if not, return unauthorized
    if (!token) {
      return res.status(401).json({ message: "You are not authorized, no token provided" });
    }

    console.log("JWT_KEY:", process.env.JWT_KEY);

    // Verify and decode the token
    jwt.verify(token, process.env.JWT_KEY, (err, payload) => {
      if (err) {
        return res.status(403).json({ message: "The token is not valid!" });
      }
      req.userId = payload.userId;
      next();


    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error during token verification" });
  }
};
