# robotevents-csv
A CSV api for RobotEvents, to make importing into spreadsheets easier

> Note: a public version of this API is available at https://robotevents.bren.app


# Endpoints

All endpoints begin with `/:sku/`, where `sku` refers to the event code, as given on RobotEvents. Event Codes typically look like `RE-VRC-21-5146`, and are specific to an individual event.

## `/:sku/teams`
Returns a list of teams in the event, in all divisions. Output columns look like:
```
Team, Team Name, Grade, Organization, City, State, Country
```

> Example: 
> ```
> $ curl https://robotevents.bren.app/RE-VRC-21-5146/teams
> 3796A,Mann Made,High School,J. L. MANN HIGH ACADEMY,Greenville,South Carolina,United States
> 3796B,Some Assembly Required,High School,J. L. MANN HIGH ACADEMY,Greenville,South Carolina,United States
> 3796C,Don't Blink,High School,J. L. MANN HIGH ACADEMY,Greenville,South Carolina,United States
> 3796D,Dread Claw,High School,J. L. MANN HIGH ACADEMY,Greenville,South Carolina,United States
> 3796E,Caution! Student Drivers!,High School,J. L. MANN HIGH ACADEMY,Greenville,South Carolina,United States
> 3796F,Pay Respects,High School,J. L. MANN HIGH ACADEMY,Greenville,South Carolina,United States
> 3796G,Kachow!,High School,J. L. MANN HIGH ACADEMY,Greenville,South Carolina,United States
> 3796H,A Certain Robotics Team,High School,J. L. MANN HIGH ACADEMY,Greenville,South Carolina,United States
> 8381C,Razor Mechanics,High School,WALHALLA HIGH,Walhalla,South Carolina,United States
> ...
> ```

## `/:sku/teams`
Returns a summary of the skills scores of an event. Output columns look like
```
Team, Driver Attempts, Driver Highscore, Programming Attempts, Programming High School
```

## `/:sku/rankings/:division`
Returns the rankings for a specific division, given by the division number. For most events, use `1` for division number. Larger events with multiple events use successive division numbers.

Output columns in are in the form
```
Rank, Team, WP, AP, SP, Wins, Losses, Ties, High Score
```

> Note: for VIQC, the average match score is reported in SP. The remaining columns are not used.

## `/skills/:program/grade`
Get the worlds skills standings for a particular program (VRC, VIQC, VEXU, ...) and grade (Elementary School, Middle School, High School, College). Additional query parameters can be used to filter by `region` and `post_season` results.]

Output columns are in the form
```
Global Rank, Score, Driver, Programming, Highest Driver, Highest Programming, Team, Team Name, SKU  
```

> Example: 
> ```
> $ curl https://robotevents.bren.app/skills/VRC/High%20School?region=South%20Carolina
> 56, 497, 296, 201, 296, 201, 3859W, Astrobots, RE-VRC-21-5122
> 178, 408, 301, 107, 301, 107, 52455A, Hyper Resolution, RE-VRC-21-6252
> 189, 402, 260, 142, 311, 142, 9447H, ¯\_(ツ)_/¯, RE-VRC-21-6252
> 212, 393, 313, 80, 313, 100, 3796F, Pay Respects, RE-VRC-21-4756
> 215, 390, 220, 170, 240, 170, 9447B, Wild Cards, RE-VRC-21-5146
> 328, 360, 280, 80, 280, 80, 3796B, Some Assembly Required, RE-VRC-21-5041
> 356, 350, 290, 60, 290, 60, 8926W, Wigglebots, RE-VRC-21-5768
> 372, 342, 242, 100, 243, 100, 3796E, Caution! Student Drivers!, RE-VRC-21-5768
> ...
> ```
