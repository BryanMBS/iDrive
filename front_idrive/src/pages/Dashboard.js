import Sidebar from "../components/Sidebar";



const Dashboard = () => {
  return (
    <div id="wrapper">
      <Sidebar />
      <div id="content-wrapper" className="d-flex flex-column">
        <div id="content">
          <div className="container-fluid">
            <h1 className="h3 mb-4 text-gray-800">Dashboard</h1>
            <p>Bienvenido al sistema de administración de iDrive.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
