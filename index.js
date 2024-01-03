const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());
require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
const port = process.env.PORT || 3097;
const { auth, requiredScopes } = require("express-oauth2-jwt-bearer");
const { User, PublicProject } = require("./schema");

const checkJwt = auth({
  aud: process.env.aud,
  audience: process.env.audience,
  issuerBaseURL: process.env.issuerBaseURL,
  algorithms: ["RS256"],
});

const checkEmail = async (req, res, next) => {
  const { email } = req.params;
  console.log(email);
  next();
};

mongoose.set("strictQuery", false);
mongoose
  .connect(process.env.mongouri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("Error with mongoDB"));

app.get("/api/private", checkJwt, function (req, res) {
  res.json({
    message:
      "Hello from a private endpoint! You need to be authenticated to see this.",
  });
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});

//create project
app.post("/create/:email", checkJwt, checkEmail, async (req, res) => {
  console.log(req.body);
  try {
    const { email } = req.params;
    const { title } = req.body;
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, projects: [] });
    }
    const existingProject = user.projects.find(
      (project) => project.title === title
    );
    if (existingProject) {
      return res.status(400).json({
        ok: false,
        error: "Project title already exists for this user",
      });
    }
    const uid = uuidv4();
    const newProject = {
      title,
      uniqueId: uid,
    };
    let publicProject = new PublicProject({
      email,
      projectID: uid,
    });
    await publicProject.save();
    user.projects.push(newProject);
    await user.save();
    res.json({ ok: true, data: user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ ok: false, error: "Failed to add project to user" });
  }
});

//get all projects
app.get("/projects/:email", checkJwt, checkEmail, async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }
    const projectTitles = user.projects.map((project) => ({
      title: project.title,
      screenshot: project?.flow[0]?.screenshot || null,
      uniqueId: project.uniqueId,
    }));
    res.json({ ok: true, projects: projectTitles });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ ok: false, error: "Failed to fetch project titles" });
  }
});

//get project details
app.get("/projects/:email/:title", checkJwt, checkEmail, async (req, res) => {
  try {
    const { email, title } = req.params;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }
    const project = user.projects.find((project) => project.title === title);
    if (!project) {
      return res.status(404).json({ ok: false, error: "Project not found" });
    }
    res.json({ ok: true, project });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ ok: false, error: "Failed to fetch project details" });
  }
});

//get public project details
app.get("/publicproject/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const publicProject = await PublicProject.findOne({ projectID: id });
    if (!publicProject) {
      return res.status(404).json({ ok: false, error: "Project not found" });
    }
    const user = await User.findOne({ email: publicProject.email });
    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }
    const project = user.projects.find((project) => project.uniqueId === id);
    if (!project) {
      return res.status(404).json({ ok: false, error: "Project not found" });
    }
    res.json({ ok: true, project });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ ok: false, error: "Failed to fetch project details" });
  }
});

//update project details
app.put("/projects/:email/:title", checkJwt, checkEmail, async (req, res) => {
  try {
    const { email, title } = req.params;
    const updatedDetails = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }
    const project = user.projects.find((project) => project.title === title);
    if (!project) {
      return res.status(404).json({ ok: false, error: "Project not found" });
    }
    updatedDetails.uniqueId = project.uniqueId;
    Object.assign(project, updatedDetails);
    await user.save();
    res.json({ ok: true, message: "Project details updated successfully" });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ ok: false, error: "Failed to update project details" });
  }
});
