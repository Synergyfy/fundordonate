import { Router } from "express";
import { adminRouter } from "./admin";
import { authRouter } from "./auth";
import { campaignsRouter } from "./campaigns";
import { engagementRouter } from "./engagement";
import { fundraiserRouter } from "./fundraiser";
import { gatewayRouter } from "./gateway";
import integrationsRouter from "./integrations";
import { paymentsRouter } from "./payments";
import { receiptRouter } from "./receipt";
import { rolesRouter } from "./roles";
import { taxonomyRouter } from "./taxonomy";
import { userDashboardRouter } from "./user-dashboard";
import { walletRouter } from "./wallet";

const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use(adminRouter);
apiRouter.use(fundraiserRouter);
apiRouter.use(userDashboardRouter);
apiRouter.use(walletRouter);
apiRouter.use("/campaigns", campaignsRouter);
apiRouter.use("/campaigns/:id", engagementRouter);
apiRouter.use("/campaigns/:id", paymentsRouter);
apiRouter.use("/", gatewayRouter);
apiRouter.use("/", receiptRouter);
apiRouter.use("/", rolesRouter);
apiRouter.use("/", taxonomyRouter);
apiRouter.use("/integrations", integrationsRouter);

apiRouter.get("/", (_req, res) => {
  res.json({ message: "FundorDonate API v1" });
});

export { apiRouter };
