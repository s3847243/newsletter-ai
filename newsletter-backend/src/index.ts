import express from "express";
import cors from "cors";
import morgan from "morgan";
import { env } from "./config/env";
import { authRouter } from "./routes/auth.routes";
import { creatorProfileRouter } from "./routes/creatorProfile.routes";
import { newsletterRouter } from "./routes/newsletter.routes";
import { publicRouter } from "./routes/public.routes";
import { subscriptionRouter } from "./routes/subscription.routes";
import { creatorsRouter } from "./routes/creators.routes";
import { timelineRouter } from "./routes/timeline.routes";
import { aiRouter } from "./routes/ai.routes";
import { uploadRouter } from "./routes/upload.routes";
import cookieParser from "cookie-parser";

const app = express();
app.use(cookieParser());

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://newsletter-ai-ashy.vercel.app",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan("dev"));

// Healthcheck
app.get("/api/v1/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/creator-profile", creatorProfileRouter);
app.use("/api/v1/newsletters", newsletterRouter);
app.use("/api/v1/public", publicRouter);
app.use("/api", subscriptionRouter);       
app.use("/api/v1/creators", creatorsRouter); 
app.use("/api/v1/timeline", timelineRouter);  
app.use("/api/v1/ai", aiRouter);              

app.use("/api/v1/upload", uploadRouter);

app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    res
      .status(err.status || 500)
      .json({ message: err.message || "Internal server error" });
  }
);

app.listen(env.port, () => {
  console.log(`API running on http://localhost:${env.port}`);
});
