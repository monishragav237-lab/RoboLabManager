import { useEffect, useState } from "react";
import "./App.css";

interface Robot {
  _id: string;
  robotCode: string;
  name: string;
  type: string;
  status: string;
  location: string;
  batteryLevel: number;
  description: string;
}

interface Activity {
  id: string;
  icon: string;
  title: string;
  description: string;
  time: string;
}

const API_URL = "http://localhost:5001/api/robots";
const ACTIVITY_API = "http://localhost:5001/api/activities";

function App() {
  const [robots, setRobots] = useState<Robot[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editingRobot, setEditingRobot] = useState<Robot | null>(null);
  const [selectedRobot, setSelectedRobot] = useState<Robot | null>(null);

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [formData, setFormData] = useState({
    robotCode: "",
    name: "",
    type: "",
    status: "Active",
    location: "",
    batteryLevel: 100,
    description: "",
  });

  useEffect(() => {
    fetchRobots();
    fetchActivities();

    const refreshTimer = setInterval(() => {
      fetchRobots();
      fetchActivities();
    }, 5000);

    return () => {
      clearInterval(refreshTimer);
    };
  }, []);

  const fetchRobots = async () => {
    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Failed to fetch robots");
      }

      const data = await response.json();
      setRobots(data);
    } catch (error) {
      console.log("Robot fetch error:", error);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await fetch(ACTIVITY_API);

      if (!response.ok) {
        throw new Error("Failed to fetch activities");
      }

      const data = await response.json();
      setActivities(data);
    } catch (error) {
      console.log("Activity fetch error:", error);
    }
  };

  const addActivity = async (
    icon: string,
    title: string,
    description: string
  ) => {
    try {
      const response = await fetch(ACTIVITY_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          icon,
          title,
          description,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save activity");
      }

      const newActivity = await response.json();

      setActivities((previous) => [
        newActivity,
        ...previous,
      ]);
    } catch (error) {
      console.log("Activity error:", error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement |
      HTMLSelectElement |
      HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]:
        name === "batteryLevel"
          ? Number(value)
          : value,
    });
  };

  const openAddForm = () => {
    setEditingRobot(null);

    setFormData({
      robotCode: "",
      name: "",
      type: "",
      status: "Active",
      location: "",
      batteryLevel: 100,
      description: "",
    });

    setShowForm(true);
  };

  const openEditForm = (robot: Robot) => {
    setEditingRobot(robot);

    setFormData({
      robotCode: robot.robotCode,
      name: robot.name,
      type: robot.type,
      status: robot.status,
      location: robot.location,
      batteryLevel: robot.batteryLevel,
      description: robot.description,
    });

    setShowForm(true);
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    try {
      let response;

      if (editingRobot) {
        response = await fetch(
          `${API_URL}/${editingRobot._id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
          }
        );
      } else {
        response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });
      }

      if (!response.ok) {
        throw new Error("Robot request failed");
      }

      const savedRobot = await response.json();

      if (editingRobot) {
        setRobots((previous) =>
          previous.map((robot) =>
            robot._id === editingRobot._id
              ? savedRobot
              : robot
          )
        );

        await addActivity(
          "✏️",
          "Robot Updated",
          `${savedRobot.name} was updated`
        );

        alert("Robot updated successfully!");
      } else {
        setRobots((previous) => [
          savedRobot,
          ...previous,
        ]);

        await addActivity(
          "🤖",
          "Robot Added",
          `${savedRobot.name} was added to the fleet`
        );

        alert("Robot added successfully!");
      }

      setShowForm(false);
      setEditingRobot(null);

      setFormData({
        robotCode: "",
        name: "",
        type: "",
        status: "Active",
        location: "",
        batteryLevel: 100,
        description: "",
      });
    } catch (error) {
      console.log("Save error:", error);

      alert(
        "Could not save robot. Check your backend."
      );
    }
  };

  const handleDelete = async (id: string) => {
    const robot = robots.find(
      (item) => item._id === id
    );

    if (!window.confirm("Delete this robot?")) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      setRobots((previous) =>
        previous.filter(
          (item) => item._id !== id
        )
      );

      if (robot) {
        await addActivity(
          "🗑️",
          "Robot Deleted",
          `${robot.name} was removed from the fleet`
        );
      }

      alert("Robot deleted successfully!");
    } catch (error) {
      console.log("Delete error:", error);
      alert("Could not delete robot.");
    }
  };

  const filteredRobots = robots.filter((robot) => {
    const search = searchText.toLowerCase();

    const matchesSearch =
      robot.robotCode
        .toLowerCase()
        .includes(search) ||
      robot.name
        .toLowerCase()
        .includes(search) ||
      robot.type
        .toLowerCase()
        .includes(search) ||
      robot.location
        .toLowerCase()
        .includes(search);

    const matchesStatus =
      statusFilter === "All" ||
      robot.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalRobots = robots.length;

  const activeRobots = robots.filter(
    (robot) => robot.status === "Active"
  ).length;

  const maintenanceRobots = robots.filter(
    (robot) => robot.status === "Maintenance"
  ).length;

  const averageBattery =
    robots.length > 0
      ? Math.round(
          robots.reduce(
            (total, robot) =>
              total + robot.batteryLevel,
            0
          ) / robots.length
        )
      : 0;

  const activeRate =
    totalRobots > 0
      ? Math.round(
          (activeRobots / totalRobots) * 100
        )
      : 0;

  const locations = Array.from(
    new Set(
      robots.map((robot) => robot.location)
    )
  );

  const goToSection = (id: string) => {
    document
      .getElementById(id)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  return (
    <div className="app">

      <aside className="sidebar">

        <div className="logo-area">
          <div className="logo-icon">
            🤖
          </div>

          <div>
            <h1>RoboLAN</h1>
            <span>MANAGER</span>
          </div>
        </div>

        <nav className="navigation">

          <div className="nav-title">
            MAIN MENU
          </div>

          <div
            className="nav-item active"
            onClick={() => {
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            }}
          >
            <span>▦</span>
            Dashboard
          </div>

          <div
            className="nav-item"
            onClick={() => goToSection("robots")}
          >
            <span>🤖</span>
            Robots
          </div>

          <div
            className="nav-item"
            onClick={() => goToSection("locations")}
          >
            <span>📍</span>
            Locations
          </div>

          <div
            className="nav-item"
            onClick={() => goToSection("activity")}
          >
            <span>📊</span>
            Activity
          </div>

          <div className="nav-item">
            <span>⚙️</span>
            Settings
          </div>

        </nav>

        <div className="sidebar-bottom">

          <div className="system-status">
            <div className="status-dot"></div>

            <div>
              <strong>
                System Online
              </strong>

              <small>
                All services operational
              </small>
            </div>
          </div>

        </div>

      </aside>

      <main className="main-content">

        <header className="topbar">

          <div>
            <p className="welcome-text">
              WELCOME BACK
            </p>

            <h2>
              Robot Dashboard
            </h2>
          </div>

          <div className="topbar-right">

            <div className="live-indicator">
              <span></span>
              LIVE
            </div>

            <div className="profile">

              <div className="profile-avatar">
                H
              </div>

              <div>
                <strong>
                  Administrator
                </strong>

                <small>
                  Robot Manager
                </small>
              </div>

            </div>

          </div>

        </header>

        <section className="dashboard">

          <div className="stats-grid">

            <div className="stat-card">

              <div className="stat-icon blue">
                🤖
              </div>

              <div>
                <span>
                  Total Robots
                </span>

                <h3>
                  {totalRobots}
                </h3>

                <small>
                  Registered robots
                </small>
              </div>

            </div>

            <div className="stat-card">

              <div className="stat-icon green">
                ✓
              </div>

              <div>
                <span>
                  Active Robots
                </span>

                <h3>
                  {activeRobots}
                </h3>

                <small>
                  Currently operational
                </small>
              </div>

            </div>

            <div className="stat-card">

              <div className="stat-icon orange">
                ⚙
              </div>

              <div>
                <span>
                  Maintenance
                </span>

                <h3>
                  {maintenanceRobots}
                </h3>

                <small>
                  Needs attention
                </small>
              </div>

            </div>

            <div className="stat-card">

              <div className="stat-icon purple">
                ⚡
              </div>

              <div>
                <span>
                  Avg. Battery
                </span>

                <h3>
                  {averageBattery}%
                </h3>

                <small>
                  Across all robots
                </small>
              </div>

            </div>

          </div>

          <section className="monitoring-section">

            <div className="monitoring-header">

              <div>
                <p className="section-label">
                  LIVE MONITORING
                </p>

                <h3>
                  Fleet Health
                </h3>
              </div>

              <div className="monitoring-live">
                <span></span>
                Live Data
              </div>

            </div>

            <div className="monitoring-grid">

              <div className="monitor-card">

                <div className="monitor-card-header">

                  <div>
                    <span className="monitor-title">
                      Battery Health
                    </span>

                    <h4>
                      {averageBattery}%
                    </h4>
                  </div>

                  <div className="monitor-icon">
                    🔋
                  </div>

                </div>

                <div className="health-bar">
                  <div
                    className="health-fill"
                    style={{
                      width:
                        `${averageBattery}%`,
                    }}
                  ></div>
                </div>

                <p>
                  Average battery level across
                  all registered robots.
                </p>

              </div>

              <div className="monitor-card">

                <div className="monitor-card-header">

                  <div>
                    <span className="monitor-title">
                      Active Rate
                    </span>

                    <h4>
                      {activeRate}%
                    </h4>
                  </div>

                  <div className="monitor-icon">
                    ⚡
                  </div>

                </div>

                <div className="health-bar">
                  <div
                    className="health-fill"
                    style={{
                      width:
                        `${activeRate}%`,
                    }}
                  ></div>
                </div>

                <p>
                  Percentage of robots currently
                  active.
                </p>

              </div>

              <div className="monitor-card">

                <div className="monitor-card-header">

                  <div>
                    <span className="monitor-title">
                      Maintenance
                    </span>

                    <h4>
                      {maintenanceRobots}
                    </h4>
                  </div>

                  <div className="monitor-icon">
                    🛠️
                  </div>

                </div>

                <div className="maintenance-info">
                  {maintenanceRobots > 0
                    ? "Attention required"
                    : "All robots operational"}
                </div>

                <p>
                  Current maintenance status.
                </p>

              </div>

            </div>

          </section>

          <section
            className="locations-section"
            id="locations"
          >

            <div className="section-header">

              <div>
                <p className="section-label">
                  ROBOT LOCATIONS
                </p>

                <h3>
                  Location Overview
                </h3>
              </div>

              <div className="location-count">
                {locations.length} Locations
              </div>

            </div>

            <div className="locations-grid">

              {locations.map((location) => {

                const locationRobots =
                  robots.filter(
                    (robot) =>
                      robot.location === location
                  );

                const locationActive =
                  locationRobots.filter(
                    (robot) =>
                      robot.status === "Active"
                  ).length;

                const locationBattery =
                  locationRobots.length > 0
                    ? Math.round(
                        locationRobots.reduce(
                          (total, robot) =>
                            total +
                            robot.batteryLevel,
                          0
                        ) /
                          locationRobots.length
                      )
                    : 0;

                return (
                  <div
                    className="location-card"
                    key={location}
                  >

                    <div className="location-card-top">

                      <div className="location-icon">
                        📍
                      </div>

                      <span className="location-online">
                        ● Online
                      </span>

                    </div>

                    <h4>
                      {location}
                    </h4>

                    <div className="location-stats">

                      <div>
                        <span>
                          Robots
                        </span>

                        <strong>
                          {locationRobots.length}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Active
                        </span>

                        <strong>
                          {locationActive}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Battery
                        </span>

                        <strong>
                          {locationBattery}%
                        </strong>
                      </div>

                    </div>

                  </div>
                );
              })}

              {locations.length === 0 && (
                <div className="locations-empty">

                  <div>
                    📍
                  </div>

                  <h4>
                    No Locations Available
                  </h4>

                  <p>
                    Add a robot with a location
                    to see it here.
                  </p>

                </div>
              )}

            </div>

          </section>

          <section
            className="activity-section"
            id="activity"
          >

            <div className="section-header">

              <div>
                <p className="section-label">
                  SYSTEM MONITORING
                </p>

                <h3>
                  Recent Activity
                </h3>
              </div>

              <div className="activity-count">
                {activities.length} Events
              </div>

            </div>

            <div className="activity-panel">

              {activities.length === 0 ? (

                <div className="activity-empty">

                  <div className="activity-empty-icon">
                    📊
                  </div>

                  <h4>
                    No Recent Activity
                  </h4>

                  <p>
                    Robot actions will appear
                    here automatically.
                  </p>

                </div>

              ) : (

                <div className="activity-list">

                  {activities
                    .slice(0, 8)
                    .map((activity, index) => (

                      <div
                        className="activity-item"
                        key={
                          activity.id ||
                          index
                        }
                      >

                        <div className="activity-icon">
                          {activity.icon}
                        </div>

                        <div className="activity-content">

                          <strong>
                            {activity.title}
                          </strong>

                          <p>
                            {activity.description}
                          </p>

                        </div>

                        <span className="activity-time">
                          {activity.time}
                        </span>

                      </div>

                    ))}

                </div>

              )}

            </div>

          </section>

          <section
            className="robot-section"
            id="robots"
          >

            <div className="section-header">

              <div>
                <p className="section-label">
                  FLEET MANAGEMENT
                </p>

                <h3>
                  Robot Overview
                </h3>
              </div>

              <button
                className="add-button"
                onClick={openAddForm}
              >
                + Add Robot
              </button>

            </div>

            <div className="search-filter">

              <div className="search-box">

                <span>
                  🔍
                </span>

                <input
                  type="text"
                  placeholder="Search robots..."
                  value={searchText}
                  onChange={(e) =>
                    setSearchText(
                      e.target.value
                    )
                  }
                />

              </div>

              <select
                className="status-filter"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value
                  )
                }
              >

                <option value="All">
                  All Status
                </option>

                <option value="Active">
                  Active
                </option>

                <option value="Maintenance">
                  Maintenance
                </option>

                <option value="Inactive">
                  Inactive
                </option>

              </select>

              <button
                className="clear-filter"
                onClick={() => {
                  setSearchText("");
                  setStatusFilter("All");
                }}
              >
                Clear
              </button>

            </div>

            {filteredRobots.length === 0 ? (

              <div className="empty-state">

                <div className="empty-icon">
                  🤖
                </div>

                <h3>
                  No Robots Found
                </h3>

                <p>
                  Try adding a robot or
                  changing your search.
                </p>

              </div>

            ) : (

              <div className="robot-grid">

                {filteredRobots.map((robot) => (

                  <div
                    className="robot-card"
                    key={robot._id}
                  >

                    <div className="robot-card-top">

                      <div className="robot-image">
                        🤖
                      </div>

                      <span className="robot-status">
                        {robot.status}
                      </span>

                    </div>

                    <div className="robot-info">

                      <div className="robot-code">
                        {robot.robotCode}
                      </div>

                      <h4>
                        {robot.name}
                      </h4>

                      <p className="robot-type">
                        {robot.type}
                      </p>

                      <div className="robot-details">

                        <div>
                          <span>📍</span>
                          <p>
                            {robot.location}
                          </p>
                        </div>

                        <div>
                          <span>🔋</span>
                          <p>
                            {robot.batteryLevel}%
                            Battery
                          </p>
                        </div>

                      </div>

                      <div className="battery-bar">

                        <div
                          className="battery-fill"
                          style={{
                            width:
                              `${robot.batteryLevel}%`,
                          }}
                        ></div>

                      </div>

                      <p className="description">
                        {robot.description}
                      </p>

                    </div>

                    <div className="robot-actions">

                      <button
                        className="view-button"
                        onClick={() =>
                          setSelectedRobot(robot)
                        }
                      >
                        View Details
                      </button>

                      <button
                        className="edit-button"
                        onClick={() =>
                          openEditForm(robot)
                        }
                      >
                        Edit
                      </button>

                      <button
                        className="delete-button"
                        onClick={() =>
                          handleDelete(
                            robot._id
                          )
                        }
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                ))}

              </div>

            )}

          </section>

        </section>

      </main>

      {showForm && (

        <div className="modal-overlay">

          <div className="modal">

            <div className="modal-header">

              <div>

                <p className="section-label">
                  FLEET MANAGEMENT
                </p>

                <h2>
                  {editingRobot
                    ? "Edit Robot"
                    : "Add New Robot"}
                </h2>

              </div>

              <button
                className="close-button"
                onClick={() =>
                  setShowForm(false)
                }
              >
                ×
              </button>

            </div>

            <form onSubmit={handleSubmit}>

              <div className="form-grid">

                <div className="form-group">

                  <label>
                    Robot Code
                  </label>

                  <input
                    type="text"
                    name="robotCode"
                    placeholder="RB001"
                    value={formData.robotCode}
                    onChange={handleChange}
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    Robot Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    placeholder="Alpha Bot"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    Robot Type
                  </label>

                  <input
                    type="text"
                    name="type"
                    placeholder="Delivery Robot"
                    value={formData.type}
                    onChange={handleChange}
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    Status
                  </label>

                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >

                    <option value="Active">
                      Active
                    </option>

                    <option value="Maintenance">
                      Maintenance
                    </option>

                    <option value="Inactive">
                      Inactive
                    </option>

                  </select>

                </div>

                <div className="form-group">

                  <label>
                    Location
                  </label>

                  <input
                    type="text"
                    name="location"
                    placeholder="Lab 1"
                    value={formData.location}
                    onChange={handleChange}
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    Battery Level (%)
                  </label>

                  <input
                    type="number"
                    name="batteryLevel"
                    min="0"
                    max="100"
                    value={formData.batteryLevel}
                    onChange={handleChange}
                    required
                  />

                </div>

              </div>

              <div className="form-group">

                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  placeholder="Enter robot description..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                ></textarea>

              </div>

              <div className="form-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={() =>
                    setShowForm(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-button"
                >
                  {editingRobot
                    ? "Update Robot"
                    : "Save Robot"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {selectedRobot && (

        <div className="modal-overlay">

          <div className="details-modal">

            <div className="details-header">

              <div>

                <p className="section-label">
                  ROBOT DETAILS
                </p>

                <h2>
                  {selectedRobot.name}
                </h2>

              </div>

              <button
                className="close-button"
                onClick={() =>
                  setSelectedRobot(null)
                }
              >
                ×
              </button>

            </div>

            <div className="details-robot-icon">
              🤖
            </div>

            <div className="details-grid">

              <div className="detail-item">
                <span>Robot Code</span>
                <strong>
                  {selectedRobot.robotCode}
                </strong>
              </div>

              <div className="detail-item">
                <span>Robot Type</span>
                <strong>
                  {selectedRobot.type}
                </strong>
              </div>

              <div className="detail-item">
                <span>Status</span>
                <strong>
                  {selectedRobot.status}
                </strong>
              </div>

              <div className="detail-item">
                <span>Location</span>
                <strong>
                  {selectedRobot.location}
                </strong>
              </div>

              <div className="detail-item">
                <span>Battery</span>
                <strong>
                  {selectedRobot.batteryLevel}%
                </strong>
              </div>

              <div className="detail-item">
                <span>Robot ID</span>
                <strong>
                  {selectedRobot._id}
                </strong>
              </div>

            </div>

            <div className="detail-description">

              <span>
                Description
              </span>

              <p>
                {selectedRobot.description ||
                  "No description available."}
              </p>

            </div>

            <div className="details-actions">

              <button
                className="cancel-button"
                onClick={() =>
                  setSelectedRobot(null)
                }
              >
                Close
              </button>

              <button
                className="save-button"
                onClick={() => {
                  setSelectedRobot(null);
                  openEditForm(selectedRobot);
                }}
              >
                Edit Robot
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default App;