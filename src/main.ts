import * as robotevents from "robotevents";
import Koa from "koa";
import Router from "@koa/router";
import { Event } from "robotevents/out/endpoints/events";
import { Team } from "robotevents/out/endpoints/teams";
import http from "http";

const tokens = require("../token.json");

const app = new Koa();
const router = new Router();

function escape(text: string) {
  return text.replace(/,/g, "");
}

router.get("/:sku/teams", async (ctx, next) => {
  const sku = ctx.params["sku"];

  const event = await robotevents.events.get(sku);
  if (!event) {
    ctx.body = "No such event";
    return next();
  }

  let response = "";

  const teams = await event.teams();
  for (const team of teams) {
    response += `${team.number},${escape(team.team_name)},${
      team.grade
    },${escape(team.organization)},${team.location.city},${
      team.location.region
    },${team.location.country}\n`;
  }

  ctx.body = response;
  return next();
});

async function getSkillsRecord(event: Event, team: Team) {
  const runs = await event.skills({ team: [team.id] });

  let attempts = {
    programming: 0,
    driver: 0,
  };

  let highscore = {
    programming: 0,
    driver: 0,
  };

  for (const run of runs) {
    if (run.type == "programming") {
      attempts.programming++;
      if (run.score > highscore.programming) {
        highscore.programming = run.score;
      }
    } else if (run.type == "driver") {
      attempts.driver++;
      if (run.score > highscore.driver) {
        highscore.driver = run.score;
      }
    }
  }

  return { attempts, highscore };
}

router.get("/:sku/skills", async (ctx, next) => {
  const sku = ctx.params["sku"];

  const event = await robotevents.events.get(sku);
  if (!event) {
    ctx.body = "No such event";
    return next();
  }

  let response = "";

  const teams = await event.teams();
  const records = await Promise.all(
    teams.array().map(async (team) => ({
      team: team.number,
      ...(await getSkillsRecord(event, team)),
    }))
  );

  for (const record of records) {
    response += `${record.team},${record.attempts.driver},${record.highscore.driver},${record.attempts.programming},${record.highscore.programming}\n`;
  }

  ctx.body = response;

  return next();
});

router.get("/:sku/rankings/:division", async (ctx, next) => {
  const sku = ctx.params["sku"];
  const division = ctx.params["division"];

  const event = await robotevents.events.get(sku);
  if (!event) {
    ctx.body = "No such event";
    return next();
  }

  let response = "";

  const rankings = (await event.rankings(division))
    .array()
    .sort((a, b) => a.rank - b.rank);

  for (const rank of rankings) {
    response += `${rank.rank},${rank.team.name},${rank.wp},${rank.ap},${rank.sp},${rank.wins},${rank.losses},${rank.ties},${rank.high_score}\n`;
  }

  ctx.body = response;

  return next();
});

// Authenticate with the API
robotevents.authentication.setBearer(tokens.robotevents);

app.use(router.routes()).use(router.allowedMethods());

const server = http.createServer(
  app.callback()
);

server.listen(8080, () => {
  console.log("[log] listening on port 8080")
});
