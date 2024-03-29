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
  robotevents.authentication.setBearer(tokens.robotevents);

  const sku = ctx.params["sku"];

  const event = await robotevents.events.get(sku);
  if (!event) {
    ctx.body = "No such event";
    return next();
  }

  let response = "";

  const teams = await event.teams();
  for (const team of teams) {
    response += `${team.number},${escape(team.team_name)},${team.grade
      },${escape(team.organization)},${team.location.city},${team.location.region
      },${team.location.country}\n`;
  }

  ctx.body = response;
  return next();
});

const ROUND_NAMES = {
  1: "Practice",
  2: "Qualification",
  3: "Quarterfinals",
  4: "Semifinals",
  5: "Finals",
  6: "Round of 16",
};

const ROUND_NAMES_SHORT = {
  1: "P",
  2: "Q",
  3: "QF",
  4: "SF",
  5: "F",
  6: "R16",
};

router.get("/:sku/matches/:division", async (ctx, next) => {
  robotevents.authentication.setBearer(tokens.robotevents);

  const sku = ctx.params["sku"];
  const division = parseInt(ctx.params["division"]) ?? 0;

  let team = ctx.query["team"];
  if (team) {
    team = team.split(",");
  } else {
    team = [];
  }

  const event = await robotevents.events.get(sku);
  if (!event) {
    ctx.body = "No such event";
    return next();
  }
  console.log(event.id);

  let response = "";

  const matches = await event.matches(division, { team });
  for (const match of matches) {
    response += `${match.division},${match.field},${match.scheduled},${ROUND_NAMES_SHORT[match.round]}${match.instance} ${match.matchnum}\n`;
  };

  ctx.body = response;
  return next();

});


async function getSkillsRecord(event: Event, team: Team) {
  robotevents.authentication.setBearer(tokens.robotevents);

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
    ``
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
  robotevents.authentication.setBearer(tokens.robotevents);

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
  robotevents.authentication.setBearer(tokens.robotevents);

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
    response += `${rank.rank},${escape(rank.team.name)},${rank.wp},${rank.ap},${rank.sp},${rank.wins},${rank.losses},${rank.ties},${rank.high_score}\n`;
  }

  ctx.body = response;

  return next();
});

// Skills Leaderboard
router.get("/skills/:program/:grade", async (ctx, next) => {
  robotevents.authentication.setBearer(tokens.robotevents);

  const program = ctx.params["program"];
  const grade = ctx.params["grade"];
  const season = robotevents.seasons.current(program);

  const region = ctx.query["region"];
  const post_season = ctx.query["post_season"];

  if (!season) {
    ctx.body = "No such season";
    return;
  };

  const skills = await robotevents.v1.getSkillsLeaderboard(season, {
    grade_level: grade,
    region,
    post_season,
  });

  ctx.body = "";
  for (const { event, rank, scores, team } of skills) {
    ctx.body += `${rank}, ${scores.driver + scores.programming}, ${scores.driver}, ${scores.programming}, ${scores.maxDriver}, ${scores.maxProgramming}, ${team.team}, ${team.teamName}, ${event.sku}\n`;
  };

  return next();
});


router.get("/teams/:program/:team/events", async (ctx, next) => {
  robotevents.authentication.setBearer(tokens.robotevents);

  const team = await robotevents.teams.get(ctx.params["team"], ctx.params["program"]);
  const season = await robotevents.seasons.current(ctx.params["program"]);

  if (!season) {
    ctx.body = "No such season";
    return next();
  }

  if (!team) {
    ctx.body = "No such team";
    return next();
  }

  const start = ctx.query["start"];
  const end = ctx.query["end"];
  const level = ctx.query["level"];

  const events = await team.events({ start, end, level, season: [season] })
    .then(events => events.array())
    .then(events => events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()));

  ctx.body = "";
  for (const event of events) {
    ctx.body += `${event.id},${event.sku},${event.name},${event.level},${event.start},${event.end}  \n`;
  };

  return next();
});

router.get("/teams/:program/:team/awards", async (ctx, next) => {
  robotevents.authentication.setBearer(tokens.robotevents);

  const team = await robotevents.teams.get(ctx.params["team"], ctx.params["program"]);
  const season = await robotevents.seasons.current(ctx.params["program"]);

  if (!season) {
    ctx.body = "No such season";
    return next();
  }

  if (!team) {
    ctx.body = "No such team";
    return next();
  }

  const awards = await team.awards({ season: [season] })

  ctx.body = "";
  for (const award of awards) {
    ctx.body += `${award.id},${award.order},${award.event.code},${award.event.name},${award.title},${award.qualifications}\n`
  };

  return next();
});

router.get("/teams/:program/:team/matches", async (ctx, next) => {
  robotevents.authentication.setBearer(tokens.robotevents);

  const team = await robotevents.teams.get(ctx.params["team"], ctx.params["program"]);
  const season = await robotevents.seasons.current(ctx.params["program"]);

  if (!season) {
    ctx.body = "No such season";
    return next();
  }

  if (!team) {
    ctx.body = "No such team";
    return next();
  }

  const matches = await team.matches({ season: [season] })

  ctx.body = "";
  for (const match of matches) {
    ctx.body += `${match.event.code},${match.division},${match.field},${match.scheduled},${ROUND_NAMES_SHORT[match.round]}${match.instance} ${match.matchnum}\n`;
  };

  return next();
});




// Authenticate with the API

app.use(router.routes()).use(router.allowedMethods());

const server = http.createServer(
  app.callback()
);

server.listen(8080, () => {
  console.log("[log] listening on port 8080")
});
