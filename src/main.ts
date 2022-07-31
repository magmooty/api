import express from "express";
import { metrics } from "@/components";

const app = express();

metrics.installApp(app);
