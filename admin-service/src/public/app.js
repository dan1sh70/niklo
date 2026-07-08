const { useState, useEffect, useRef } = React;

// Simple Icon Component Helper using Lucide icons
const Icon = ({ name, className = "w-4 h-4" }) => {
  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [name]);
  return <i data-lucide={name} className={className}></i>;
};

// Rich Text HTML Editor Component using contentEditable
const RichTextEditor = ({ value, onChange, placeholder }) => {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command, val = null) => {
    document.execCommand(command, false, val);
    handleInput();
  };

  return (
    <div className="border border-slate-300 rounded-lg overflow-hidden bg-white">
      <div className="flex gap-2 p-2 bg-slate-50 border-b border-slate-200">
        <button type="button" onClick={() => execCommand('bold')} className="px-2 py-0.5 hover:bg-slate-200 rounded font-bold text-xs" title="Bold">B</button>
        <button type="button" onClick={() => execCommand('italic')} className="px-2 py-0.5 hover:bg-slate-200 rounded italic text-xs" title="Italic">I</button>
        <button type="button" onClick={() => execCommand('underline')} className="px-2 py-0.5 hover:bg-slate-200 rounded underline text-xs" title="Underline">U</button>
        <button type="button" onClick={() => {
          const url = prompt('Enter URL link:');
          if (url) execCommand('createLink', url);
        }} className="px-2 py-0.5 hover:bg-slate-200 rounded text-xs text-blue-600 font-semibold" title="Insert Link">Link</button>
        <button type="button" onClick={() => execCommand('insertUnorderedList')} className="px-2 py-0.5 hover:bg-slate-200 rounded text-xs" title="Bullet List">List</button>
        <button type="button" onClick={() => execCommand('removeFormat')} className="px-2 py-0.5 hover:bg-slate-200 rounded text-[10px] text-slate-400 font-semibold" title="Clear Styling">Clear</button>
      </div>
      <div 
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        placeholder={placeholder}
        className="p-3 min-h-[120px] max-h-[200px] overflow-y-auto text-xs focus:outline-none bg-white font-sans text-slate-700"
      />
    </div>
  );
};

// Main Admin Dashboard Component
function App() {
  // Navigation & UI Layout
  const [selectedTab, setSelectedTab] = useState('dashboard'); // dashboard, kyc, fleet, adventures, packages, explorer, dev
  const [devSubTab, setDevSubTab] = useState('logs'); // logs, redis, sql, env
  const [showAuditLogs, setShowAuditLogs] = useState(false);

  // Global State Managers
  const [discovery, setDiscovery] = useState(null);
  const [containers, setContainers] = useState([]);
  const [containerStats, setContainerStats] = useState({});
  const [adminStats, setAdminStats] = useState({});
  const [auditLogs, setAuditLogs] = useState([]);
  const [wsStatus, setWsStatus] = useState('disconnected');

  // KYC Tab Queue
  const [kycFilter, setKycFilter] = useState('all'); // all, pending, submitted, verified, rejected
  const [kycUsers, setKycUsers] = useState([]);
  
  // Transit Fleet Tab
  const [fleetSubTab, setFleetSubTab] = useState('schedules'); // schedules, operators, buses
  const [schedules, setSchedules] = useState([]);
  const [operators, setOperators] = useState([]);
  const [buses, setBuses] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [scheduleBookings, setScheduleBookings] = useState([]);
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [showAddOperatorModal, setShowAddOperatorModal] = useState(false);
  const [showAddBusModal, setShowAddBusModal] = useState(false);
  const [newSchedule, setNewSchedule] = useState({ route_id: '', bus_id: '', operator_id: '', departure_time: '', arrival_time: '', departure_date: '', base_fare: '', available_seats: '' });
  const [newOperator, setNewOperator] = useState({ name: '', contact_phone: '', contact_email: '', gst_number: '' });
  const [newBus, setNewBus] = useState({ operator_id: '', registration_number: '', bus_type: 'AC_SLEEPER', total_seats: 36, amenities: 'wifi,charging' });

  // Adventures & Packages Hub
  const [adventures, setAdventures] = useState([]);
  const [packages, setPackages] = useState([]);
  const [showAddAdventureModal, setShowAddAdventureModal] = useState(false);
  const [showAddPackageModal, setShowAddPackageModal] = useState(false);
  const [showEditAdventureModal, setShowEditAdventureModal] = useState(false);
  const [showEditPackageModal, setShowEditPackageModal] = useState(false);
  const [editingAdventure, setEditingAdventure] = useState(null);
  const [editingPackage, setEditingPackage] = useState(null);
  const [newAdventure, setNewAdventure] = useState({ title: '', description: '', price: '', duration_days: '', duration_nights: '', destinations: '', inclusions: '' });
  const [newPackage, setNewPackage] = useState({ title: '', description: '', price: '', duration_days: '', duration_nights: '', destinations: '', inclusions: '' });

  // Data Explorer Spreadsheet CRUD
  const [activeService, setActiveService] = useState('user-service');
  const [activeTable, setActiveTable] = useState('users');
  const [dbTables, setDbTables] = useState([]);
  const [dbSchema, setDbSchema] = useState(null);
  const [dbRowsData, setDbRowsData] = useState({ rows: [], total: 0, page: 1, limit: 10, totalPages: 1 });
  const [dbFilters, setDbFilters] = useState({});
  const [dbSort, setDbSort] = useState({ col: '', dir: 'ASC' });
  const [showAddRowModal, setShowAddRowModal] = useState(false);
  const [showEditRowModal, setShowEditRowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailRow, setDetailRow] = useState(null);
  const [newRowData, setNewRowData] = useState({});
  const [editingRow, setEditingRow] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPayload, setImportPayload] = useState('');
  const [importType, setImportType] = useState('json');

  // Developer Tools Settings
  const [sqlQuery, setSqlQuery] = useState('');
  const [sqlResult, setSqlResult] = useState(null);
  const [sqlError, setSqlError] = useState('');
  const [logBuffer, setLogBuffer] = useState([]);
  const [logFilter, setLogFilter] = useState('');
  const [logAutoScroll, setLogAutoScroll] = useState(true);
  const [activeLogService, setActiveLogService] = useState('');
  const [redisEvents, setRedisEvents] = useState([]);
  const [redisKeys, setRedisKeys] = useState([]);
  const [redisKeyDetail, setRedisKeyDetail] = useState(null);
  const [redisPattern, setRedisPattern] = useState('*');
  const [selectedEnvService, setSelectedEnvService] = useState('user-service');
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvVal, setNewEnvVal] = useState('');

  const wsRef = useRef(null);
  const logsEndRef = useRef(null);

  // Initialize Audit Logging Actions
  useEffect(() => {
    const saved = localStorage.getItem('niklo_admin_audit_logs');
    if (saved) {
      setAuditLogs(JSON.parse(saved));
    } else {
      const initLogs = [
        { action: 'DISCOVER', message: 'Discovered services layout and databases', timestamp: Date.now() - 3600000 },
        { action: 'SYSTEM', message: 'Admin Panel active', timestamp: Date.now() }
      ];
      setAuditLogs(initLogs);
      localStorage.setItem('niklo_admin_audit_logs', JSON.stringify(initLogs));
    }
  }, []);

  const addAuditLog = (action, message) => {
    const entry = { action, message, timestamp: Date.now() };
    setAuditLogs(prev => {
      const updated = [entry, ...prev.slice(0, 49)];
      localStorage.setItem('niklo_admin_audit_logs', JSON.stringify(updated));
      return updated;
    });
  };

  // Fetch Network Discoveries
  const fetchDiscovery = async () => {
    try {
      const res = await fetch('/api/v1/admin/discovery');
      const data = await res.json();
      setDiscovery(data);
      
      const services = Object.keys(data.services);
      services.forEach(async (serviceName) => {
        if (data.services[serviceName].dbConfig) {
          try {
            const tRes = await fetch(`/api/v1/admin/db/tables/${serviceName}`);
            const tData = await tRes.json();
            if (tData.tables) {
              tData.tables.forEach(async (tableName) => {
                const rRes = await fetch(`/api/v1/admin/db/rows/${serviceName}/${tableName}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ page: 1, limit: 1 }),
                });
                const rData = await rRes.json();
                if (rData.total !== undefined) {
                  setAdminStats(prev => ({
                    ...prev,
                    [`${serviceName}.${tableName}`]: rData.total
                  }));
                }
              });
            }
          } catch (err) {}
        }
      });
    } catch (err) {
      console.error('Error fetching discovery:', err);
    }
  };

  const fetchContainers = async () => {
    try {
      const res = await fetch('/api/v1/admin/docker/containers');
      const data = await res.json();
      setContainers(data);
    } catch (err) {
      console.error('Error fetching containers:', err);
    }
  };

  const fetchKYCUsers = async () => {
    try {
      const res = await fetch('/api/v1/admin/db/rows/user-service/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: 1, limit: 100 }),
      });
      const data = await res.json();
      if (data.rows) setKycUsers(data.rows);
    } catch (err) {}
  };

  const fetchBusData = async () => {
    try {
      // schedules
      const sRes = await fetch('/api/v1/admin/db/rows/bus-service/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: 1, limit: 100 }),
      });
      const sData = await sRes.json();
      if (sData.rows) setSchedules(sData.rows);

      // operators
      const oRes = await fetch('/api/v1/admin/db/rows/bus-service/operators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: 1, limit: 100 }),
      });
      const oData = await oRes.json();
      if (oData.rows) setOperators(oData.rows);

      // buses
      const bRes = await fetch('/api/v1/admin/db/rows/bus-service/buses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: 1, limit: 100 }),
      });
      const bData = await bRes.json();
      if (bData.rows) setBuses(bData.rows);
    } catch (err) {}
  };

  const fetchAdventures = async () => {
    try {
      const res = await fetch('/api/v1/admin/db/rows/adventure-service/adventures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: 1, limit: 100 }),
      });
      const data = await res.json();
      if (data.rows) setAdventures(data.rows);
    } catch (err) {}
  };

  const fetchPackages = async () => {
    try {
      const res = await fetch('/api/v1/admin/db/rows/package-service/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: 1, limit: 100 }),
      });
      const data = await res.json();
      if (data.rows) setPackages(data.rows);
    } catch (err) {}
  };

  const fetchRedisKeys = async () => {
    try {
      const res = await fetch(`/api/v1/admin/redis/keys?pattern=${encodeURIComponent(redisPattern)}`);
      const data = await res.json();
      if (data.keys) setRedisKeys(data.keys);
    } catch (err) {}
  };

  // Connect WebSockets
  useEffect(() => {
    fetchDiscovery();
    fetchContainers();
    fetchKYCUsers();
    fetchBusData();
    fetchAdventures();
    fetchPackages();
    fetchRedisKeys();

    const interval = setInterval(() => {
      fetchContainers();
    }, 12000);

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/admin/`;
    const connectWS = () => {
      setWsStatus('connecting');
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsStatus('connected');
        ws.send(JSON.stringify({ type: 'subscribe-stats' }));
        ws.send(JSON.stringify({ type: 'subscribe-redis' }));
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'log-data') {
          setLogBuffer(prev => [...prev.slice(-499), msg.data]);
        } else if (msg.type === 'redis-event') {
          setRedisEvents(prev => [msg, ...prev.slice(0, 99)]);
        } else if (msg.type === 'stats-data') {
          const statsMap = {};
          msg.stats.forEach(s => {
            statsMap[s.service] = s;
          });
          setContainerStats(statsMap);
        } else if (msg.type === 'discovery-updated') {
          setDiscovery(msg.data);
        }
      };

      ws.onclose = () => {
        setWsStatus('disconnected');
        setTimeout(connectWS, 5000);
      };
    };

    connectWS();
    return () => {
      clearInterval(interval);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // Sync log scroll
  useEffect(() => {
    if (logAutoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logBuffer, logAutoScroll]);

  // Logs stream subscription
  const handleSubscribeLogs = (service) => {
    setActiveLogService(service);
    setLogBuffer([]);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'subscribe-logs', service }));
    }
  };

  // Docker Container action controls
  const handleContainerAction = async (service, action) => {
    try {
      const res = await fetch(`/api/v1/admin/docker/${service}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        addAuditLog('DOCKER', `${action.toUpperCase()} action run on service ${service}`);
        fetchContainers();
      } else {
        alert(`Action failed: ${data.error}`);
      }
    } catch (err) {
      alert(`Connection error: ${err.message}`);
    }
  };

  // KYC Verification Queue
  const handleVerifyKyc = async (userId, newStatus) => {
    try {
      const res = await fetch(`/api/v1/admin/db/update/user-service/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pkData: { id: userId },
          data: { kyc_status: newStatus }
        }),
      });
      const data = await res.json();
      if (data.success) {
        addAuditLog('KYC', `Approved status update to ${newStatus} for user ${userId}`);
        fetchKYCUsers();
      } else {
        alert(`KYC Update failed: ${data.error}`);
      }
    } catch (err) {
      alert(`API failure: ${err.message}`);
    }
  };

  // Schedules details inspection
  const handleSelectSchedule = async (schedule) => {
    setSelectedSchedule(schedule);
    setScheduleBookings([]);
    try {
      const res = await fetch(`/api/v1/admin/db/rows/hotel-service/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: 1,
          limit: 50,
          filters: { schedule_id: schedule.id }
        }),
      });
      const data = await res.json();
      if (data.rows) {
        setScheduleBookings(data.rows);
      }
    } catch (err) {}
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const res = await fetch(`/api/v1/admin/db/update/hotel-service/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pkData: { id: bookingId },
          data: { status: 'CANCELLED' }
        }),
      });
      const data = await res.json();
      if (data.success) {
        addAuditLog('BOOKING', `Cancelled booking record: ${bookingId}`);
        if (selectedSchedule) handleSelectSchedule(selectedSchedule);
      }
    } catch (err) {}
  };

  // Register operational items
  const handleAddSchedule = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/v1/admin/db/create/bus-service/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSchedule),
      });
      const data = await res.json();
      if (data.success) {
        addAuditLog('BUS', `Added scheduled transit route on ${newSchedule.departure_date}`);
        fetchBusData();
        setShowAddScheduleModal(false);
      }
    } catch (err) {}
  };

  const handleAddOperator = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/v1/admin/db/create/bus-service/operators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOperator),
      });
      const data = await res.json();
      if (data.success) {
        addAuditLog('BUS', `Added operator registration: ${newOperator.name}`);
        fetchBusData();
        setShowAddOperatorModal(false);
      }
    } catch (err) {}
  };

  const handleAddBus = async (e) => {
    e.preventDefault();
    const amenitiesArr = newBus.amenities.split(',').map(a => a.trim());
    try {
      const res = await fetch(`/api/v1/admin/db/create/bus-service/buses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newBus,
          amenities: amenitiesArr
        }),
      });
      const data = await res.json();
      if (data.success) {
        addAuditLog('BUS', `Registered bus plate ${newBus.registration_number}`);
        fetchBusData();
        setShowAddBusModal(false);
      }
    } catch (err) {}
  };

  // Add travel adventures & packages using our Rich Text HTML Editor
  const handleAddAdventure = async (e) => {
    e.preventDefault();
    const dest = newAdventure.destinations.split(',').map(d => d.trim());
    const inc = newAdventure.inclusions.split(',').map(i => i.trim());
    try {
      const res = await fetch(`/api/v1/admin/db/create/adventure-service/adventures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newAdventure,
          destinations: dest,
          inclusions: inc,
          price: parseFloat(newAdventure.price) || 0,
          duration_days: parseInt(newAdventure.duration_days) || 1,
          duration_nights: parseInt(newAdventure.duration_nights) || 0
        }),
      });
      const data = await res.json();
      if (data.success) {
        addAuditLog('PRODUCT', `Uploaded adventure item: ${newAdventure.title}`);
        fetchAdventures();
        setShowAddAdventureModal(false);
        setNewAdventure({ title: '', description: '', price: '', duration_days: '', duration_nights: '', destinations: '', inclusions: '' });
      }
    } catch (err) {}
  };

  const handleAddPackage = async (e) => {
    e.preventDefault();
    const dest = newPackage.destinations.split(',').map(d => d.trim());
    const inc = newPackage.inclusions.split(',').map(i => i.trim());
    try {
      const res = await fetch(`/api/v1/admin/db/create/package-service/packages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPackage,
          destinations: dest,
          inclusions: inc,
          price: parseFloat(newPackage.price) || 0,
          duration_days: parseInt(newPackage.duration_days) || 1,
          duration_nights: parseInt(newPackage.duration_nights) || 0
        }),
      });
      const data = await res.json();
      if (data.success) {
        addAuditLog('PRODUCT', `Uploaded holiday tour package: ${newPackage.title}`);
        fetchPackages();
        setShowAddPackageModal(false);
        setNewPackage({ title: '', description: '', price: '', duration_days: '', duration_nights: '', destinations: '', inclusions: '' });
      }
    } catch (err) {}
  };

  const handleEditAdventure = async (e) => {
    e.preventDefault();
    const dest = newAdventure.destinations.split(',').map(d => d.trim());
    const inc = newAdventure.inclusions.split(',').map(i => i.trim());
    try {
      const res = await fetch(`/api/v1/admin/db/update/adventure-service/adventures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pkData: { id: editingAdventure.id },
          data: {
            name: newAdventure.title,
            title: newAdventure.title,
            description: newAdventure.description,
            price: parseFloat(newAdventure.price) || 0,
            duration_days: parseInt(newAdventure.duration_days) || 1,
            duration_nights: parseInt(newAdventure.duration_nights) || 0,
            destinations: dest,
            inclusions: inc
          }
        }),
      });
      const data = await res.json();
      if (data.success) {
        addAuditLog('PRODUCT', `Edited adventure: ${newAdventure.title}`);
        fetchAdventures();
        setShowEditAdventureModal(false);
        setNewAdventure({ title: '', description: '', price: '', duration_days: '', duration_nights: '', destinations: '', inclusions: '' });
      }
    } catch (err) {}
  };

  const handleEditPackage = async (e) => {
    e.preventDefault();
    const dest = newPackage.destinations.split(',').map(d => d.trim());
    const inc = newPackage.inclusions.split(',').map(i => i.trim());
    try {
      const res = await fetch(`/api/v1/admin/db/update/package-service/packages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pkData: { id: editingPackage.id },
          data: {
            title: newPackage.title,
            description: newPackage.description,
            price: parseFloat(newPackage.price) || 0,
            duration_days: parseInt(newPackage.duration_days) || 1,
            duration_nights: parseInt(newPackage.duration_nights) || 0,
            destinations: dest,
            inclusions: inc
          }
        }),
      });
      const data = await res.json();
      if (data.success) {
        addAuditLog('PRODUCT', `Edited holiday tour package: ${newPackage.title}`);
        fetchPackages();
        setShowEditPackageModal(false);
        setNewPackage({ title: '', description: '', price: '', duration_days: '', duration_nights: '', destinations: '', inclusions: '' });
      }
    } catch (err) {}
  };

  // Explorer Data Spreadsheet CRUD handlers
  const handleExploreTable = async (service, table) => {
    setActiveService(service);
    setActiveTable(table);
    setDbFilters({});
    
    try {
      const scRes = await fetch(`/api/v1/admin/db/schema/${service}/${table}`);
      const scData = await scRes.json();
      setDbSchema(scData);
    } catch (err) {}

    handleQueryDbRows(service, table, 1, dbRowsData.limit, {}, dbSort);
  };

  const handleQueryDbRows = async (service, table, page, limit, filters, sort) => {
    try {
      const res = await fetch(`/api/v1/admin/db/rows/${service}/${table}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page, limit, filters, sortCol: sort.col, sortDir: sort.dir }),
      });
      const data = await res.json();
      if (data.rows) {
        setDbRowsData(data);
      }
    } catch (err) {}
  };

  const handleCreateRow = async () => {
    try {
      const res = await fetch(`/api/v1/admin/db/create/${activeService}/${activeTable}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRowData),
      });
      const data = await res.json();
      if (data.success) {
        addAuditLog('CRUD', `Created row in table ${activeTable}`);
        setShowAddRowModal(false);
        handleExploreTable(activeService, activeTable);
      } else {
        alert(data.error);
      }
    } catch (err) {}
  };

  const handleUpdateRow = async () => {
    const pkCol = dbSchema.primaryKeys[0];
    try {
      const res = await fetch(`/api/v1/admin/db/update/${activeService}/${activeTable}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pkData: { [pkCol]: editingRow[pkCol] },
          data: newRowData
        }),
      });
      const data = await res.json();
      if (data.success) {
        addAuditLog('CRUD', `Updated row in table ${activeTable}`);
        setShowEditRowModal(false);
        handleExploreTable(activeService, activeTable);
      } else {
        alert(data.error);
      }
    } catch (err) {}
  };

  const handleDeleteRow = async (row) => {
    if (!confirm('Are you sure you want to delete this row?')) return;
    const pkCol = dbSchema.primaryKeys[0];
    try {
      const res = await fetch(`/api/v1/admin/db/delete/${activeService}/${activeTable}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pkData: { [pkCol]: row[pkCol] } }),
      });
      const data = await res.json();
      if (data.success) {
        addAuditLog('CRUD', `Deleted row from table ${activeTable}`);
        handleExploreTable(activeService, activeTable);
      }
    } catch (err) {}
  };

  const handleBulkImport = async () => {
    try {
      let rowsToInsert = [];
      if (importType === 'json') {
        rowsToInsert = JSON.parse(importPayload);
      } else {
        const lines = importPayload.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const vals = lines[i].split(',').map(v => v.trim());
          const obj = {};
          headers.forEach((h, idx) => {
            obj[h] = vals[idx];
          });
          rowsToInsert.push(obj);
        }
      }

      for (const row of rowsToInsert) {
        await fetch(`/api/v1/admin/db/create/${activeService}/${activeTable}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(row),
        });
      }

      addAuditLog('CRUD', `Imported ${rowsToInsert.length} records into table ${activeTable}`);
      setShowImportModal(false);
      handleExploreTable(activeService, activeTable);
    } catch (err) {
      alert(`Import error: ${err.message}`);
    }
  };

  // Developer Tools operations
  const handleRunSQL = async () => {
    setSqlResult(null);
    setSqlError('');
    try {
      const res = await fetch(`/api/v1/admin/db/query/${activeService}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sqlQuery }),
      });
      const data = await res.json();
      if (data.error) {
        setSqlError(data.error);
      } else {
        setSqlResult(data);
        addAuditLog('SQL', `Ran custom query on service database ${activeService}`);
      }
    } catch (err) {
      setSqlError(err.message);
    }
  };

  const handleDeleteRedisKey = async (key) => {
    if (!confirm(`Delete key ${key}?`)) return;
    try {
      const res = await fetch(`/api/v1/admin/redis/key/${encodeURIComponent(key)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        addAuditLog('REDIS', `Evicted Redis key: ${key}`);
        fetchRedisKeys();
        setRedisKeyDetail(null);
      }
    } catch (err) {}
  };

  const handleSaveEnvConfig = async () => {
    try {
      const res = await fetch(`/api/v1/admin/config/edit/${selectedEnvService}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ envKey: newEnvKey, envValue: newEnvVal }),
      });
      const data = await res.json();
      if (data.success) {
        addAuditLog('CONFIG', `Updated variable ${newEnvKey} in service ${selectedEnvService}`);
        setNewEnvKey('');
        setNewEnvVal('');
        alert('Configuration saved!');
      }
    } catch (err) {}
  };

  const serviceOptions = discovery ? Object.keys(discovery.services) : [];
  const filteredKycUsers = kycUsers.filter(u => kycFilter === 'all' ? true : u.kyc_status === kycFilter);

  return (
    <div className="flex h-screen overflow-hidden bg-white text-slate-800">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 border-r border-slate-200 bg-slate-50 flex flex-col justify-between shrink-0">
        <div>
          {/* Header Brand */}
          <div className="p-6 border-b border-slate-200 flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-lg">N</div>
            <div>
              <h1 className="text-sm font-bold tracking-tight">Niklo Admin</h1>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Control Panel</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <button 
              onClick={() => setSelectedTab('dashboard')} 
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded text-left transition-all ${selectedTab === 'dashboard' ? 'sidebar-link-active' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <Icon name="layout-dashboard" />
              <span>Dashboard Overview</span>
            </button>
            <button 
              onClick={() => { setSelectedTab('kyc'); fetchKYCUsers(); }} 
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded text-left transition-all ${selectedTab === 'kyc' ? 'sidebar-link-active' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <Icon name="shield-check" />
              <span>Driver Verification</span>
            </button>
            <button 
              onClick={() => { setSelectedTab('fleet'); fetchBusData(); }} 
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded text-left transition-all ${selectedTab === 'fleet' ? 'sidebar-link-active' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <Icon name="bus" />
              <span>Bus & Fleet Manager</span>
            </button>
            <button 
              onClick={() => { setSelectedTab('adventures'); fetchAdventures(); }} 
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded text-left transition-all ${selectedTab === 'adventures' ? 'sidebar-link-active' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <Icon name="mountain" />
              <span>Adventures</span>
            </button>
            <button 
              onClick={() => { setSelectedTab('packages'); fetchPackages(); }} 
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded text-left transition-all ${selectedTab === 'packages' ? 'sidebar-link-active' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <Icon name="package" />
              <span>Tour Packages</span>
            </button>
            <button 
              onClick={() => { setSelectedTab('explorer'); if (discovery) handleExploreTable(activeService, activeTable); }} 
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded text-left transition-all ${selectedTab === 'explorer' ? 'sidebar-link-active' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <Icon name="database" />
              <span>Data Explorer</span>
            </button>
            <button 
              onClick={() => setSelectedTab('dev')} 
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded text-left transition-all ${selectedTab === 'dev' ? 'sidebar-link-active' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <Icon name="terminal" />
              <span>Developer Tools</span>
            </button>
          </nav>
        </div>

        {/* Footer info & connection */}
        <div className="p-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-semibold">WebSockets:</span>
            <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${wsStatus === 'connected' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
              {wsStatus}
            </span>
          </div>
          <button onClick={() => setShowAuditLogs(prev => !prev)} className="w-full py-1.5 px-3 rounded border border-slate-200 text-[10px] font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-100">
            <Icon name="history" className="w-3.5 h-3.5" />
            <span>Show Action Logs</span>
          </button>
        </div>
      </aside>

      {/* CANVAS MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
        
        {/* TOPNAV HEADER BAR */}
        <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold tracking-tight capitalize text-slate-800">Command Center / {selectedTab}</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-semibold text-slate-800">John Doe</div>
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Super Admin</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
              <Icon name="user" className="text-slate-400" />
            </div>
          </div>
        </header>

        {/* WORKSPACE CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-6 bg-white">
          
          {/* TAB 1: DASHBOARD CONSOLE */}
          {selectedTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* Quick Metrics Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="dashboard-card">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Bookings</span>
                      <span className="text-2xl font-bold font-display mt-1 block">{adminStats['hotel-service.bookings'] || 0}</span>
                    </div>
                    <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600">
                      <Icon name="calendar-check" />
                    </div>
                  </div>
                </div>

                <div className="dashboard-card">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Users</span>
                      <span className="text-2xl font-bold font-display mt-1 block">{adminStats['user-service.users'] || 0}</span>
                    </div>
                    <div className="w-8 h-8 rounded bg-green-50 flex items-center justify-center text-green-600">
                      <Icon name="users" />
                    </div>
                  </div>
                </div>

                <div className="dashboard-card">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Operators</span>
                      <span className="text-2xl font-bold font-display mt-1 block">{adminStats['bus-service.operators'] || 0}</span>
                    </div>
                    <div className="w-8 h-8 rounded bg-purple-50 flex items-center justify-center text-purple-600">
                      <Icon name="briefcase" />
                    </div>
                  </div>
                </div>

                <div className="dashboard-card">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Tour Packages</span>
                      <span className="text-2xl font-bold font-display mt-1 block">{adminStats['package-service.packages'] || 0}</span>
                    </div>
                    <div className="w-8 h-8 rounded bg-amber-50 flex items-center justify-center text-amber-600">
                      <Icon name="compass" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Containers and routing grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Microservice health container states */}
                <div className="lg:col-span-2 p-5 border border-slate-200 rounded-lg space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Services Status</h3>
                    <button onClick={fetchContainers} className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5">
                      <Icon name="refresh-cw" className="w-3 h-3" /> Sync Health
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr>
                          <th className="p-3 text-slate-500">Service Name</th>
                          <th className="p-3 text-slate-500">Status State</th>
                          <th className="p-3 text-slate-500">CPU Load</th>
                          <th className="p-3 text-slate-500">RAM Load</th>
                          <th className="p-3 text-slate-500 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {containers.map((c) => {
                          const stat = containerStats[c.service] || { cpu: '0.0%', memory: '0B' };
                          const isUp = c.state === 'running';
                          return (
                            <tr key={c.id} className="hover:bg-slate-50">
                              <td className="p-3 font-semibold font-mono">{c.service}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${isUp ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                  {c.status}
                                </span>
                              </td>
                              <td className="p-3 font-mono">{stat.cpu}</td>
                              <td className="p-3 font-mono">{stat.memory}</td>
                              <td className="p-3 text-right space-x-1.5">
                                {isUp ? (
                                  <button onClick={() => handleContainerAction(c.service, 'stop')} className="px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 font-bold text-[10px]">Stop</button>
                                ) : (
                                  <button onClick={() => handleContainerAction(c.service, 'start')} className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 font-bold text-[10px]">Start</button>
                                )}
                                <button onClick={() => handleContainerAction(c.service, 'restart')} className="px-2 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-250 font-bold text-[10px]">Restart</button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Gateway Polyline Topologies routes */}
                <div className="p-5 border border-slate-200 rounded-lg space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100">
                    Service Routing Routes
                  </h3>
                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                    {discovery?.nginxRoutes.map((r, i) => (
                      <div key={i} className="p-3 rounded border border-slate-100 bg-slate-50 flex justify-between items-center text-xs">
                        <div className="font-mono font-bold text-slate-600">{r.path}</div>
                        <div className="flex items-center gap-1.5">
                          <Icon name="arrow-right" className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">{r.targetService}:{r.targetPort}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: DRIVER KYC QUEUE */}
          {selectedTab === 'kyc' && (
            <div className="space-y-6">
              <div className="p-5 border border-slate-200 rounded-lg space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Driver Verification</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Approve drivers or update compliance KYC verification states</p>
                  </div>
                  <div className="flex gap-1 bg-slate-100 p-1 rounded">
                    {['all', 'pending', 'submitted', 'verified', 'rejected'].map((st) => (
                      <button 
                        key={st}
                        onClick={() => setKycFilter(st)}
                        className={`px-3 py-1 rounded text-[10px] font-bold capitalize transition-all ${kycFilter === st ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr>
                        <th className="p-3 text-slate-500">ID</th>
                        <th className="p-3 text-slate-500">Name</th>
                        <th className="p-3 text-slate-500">Phone</th>
                        <th className="p-3 text-slate-500">Email Address</th>
                        <th className="p-3 text-slate-500">KYC Status</th>
                        <th className="p-3 text-slate-500 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredKycUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50">
                          <td className="p-3 font-mono text-[10px] text-slate-500">{u.id}</td>
                          <td className="p-3 font-semibold">{u.name || 'Anonymous User'}</td>
                          <td className="p-3 font-mono">{u.phone}</td>
                          <td className="p-3">{u.email || <span className="text-slate-350 italic">None</span>}</td>
                          <td className="p-3">
                            <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase border ${
                              u.kyc_status === 'verified' ? 'bg-green-50 text-green-700 border-green-200' :
                              u.kyc_status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                              'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {u.kyc_status}
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-1.5">
                            {u.kyc_status !== 'verified' && (
                              <button onClick={() => handleVerifyKyc(u.id, 'verified')} className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 font-bold text-[10px]">Approve</button>
                            )}
                            {u.kyc_status !== 'rejected' && (
                              <button onClick={() => handleVerifyKyc(u.id, 'rejected')} className="px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 font-bold text-[10px]">Reject</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FLEET & BUS MANAGER */}
          {selectedTab === 'fleet' && (
            <div className="space-y-6">
              
              {/* Secondary Subnavigation tabs */}
              <div className="flex justify-between items-center">
                <div className="flex gap-1">
                  <button onClick={() => setFleetSubTab('schedules')} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${fleetSubTab === 'schedules' ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Schedules</button>
                  <button onClick={() => setFleetSubTab('operators')} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${fleetSubTab === 'operators' ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Operators</button>
                  <button onClick={() => setFleetSubTab('buses')} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${fleetSubTab === 'buses' ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Buses</button>
                </div>

                <div className="flex gap-2">
                  {fleetSubTab === 'schedules' && <button onClick={() => setShowAddScheduleModal(true)} className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-750 flex items-center gap-1.5"><Icon name="plus" /> Add Schedule</button>}
                  {fleetSubTab === 'operators' && <button onClick={() => setShowAddOperatorModal(true)} className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-750 flex items-center gap-1.5"><Icon name="plus" /> Add Operator</button>}
                  {fleetSubTab === 'buses' && <button onClick={() => setShowAddBusModal(true)} className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-750 flex items-center gap-1.5"><Icon name="plus" /> Add Bus</button>}
                </div>
              </div>

              {/* Schedules and associated Bookings operations view */}
              {fleetSubTab === 'schedules' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Column: Schedules list */}
                  <div className="lg:col-span-2 p-5 border border-slate-200 rounded-lg space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Scheduled Bus Journeys</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr>
                            <th className="p-3 text-slate-500">Date & Time</th>
                            <th className="p-3 text-slate-500">Bus Registration</th>
                            <th className="p-3 text-slate-500">Base Fare</th>
                            <th className="p-3 text-slate-500">Available Seats</th>
                            <th className="p-3 text-slate-500 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {schedules.map((sc) => (
                            <tr key={sc.id} onClick={() => handleSelectSchedule(sc)} className={`hover:bg-slate-50 cursor-pointer ${selectedSchedule?.id === sc.id ? 'bg-blue-50/50' : ''}`}>
                              <td className="p-3">
                                <div className="font-semibold">{sc.departure_date}</div>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{sc.departure_time} ➔ {sc.arrival_time}</div>
                              </td>
                              <td className="p-3 font-mono font-bold text-slate-600">{sc.bus_number || sc.bus_id}</td>
                              <td className="p-3 font-semibold">₹{sc.base_fare || sc.fare}</td>
                              <td className="p-3 font-semibold">{sc.available_seats} / 36</td>
                              <td className="p-3 text-right">
                                <Icon name="chevron-right" className="inline text-slate-400" />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right Column: Bookings list on selected schedule */}
                  <div className="p-5 border border-slate-200 rounded-lg space-y-4">
                    <div className="pb-2 border-b border-slate-100">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Booking Management</h3>
                      {selectedSchedule ? (
                        <p className="text-[10px] text-slate-400 mt-1">Bus: <span className="font-bold text-slate-600 font-mono">{selectedSchedule.bus_number}</span></p>
                      ) : (
                        <p className="text-[10px] text-slate-400 mt-1">Select a schedule from the list to review bookings</p>
                      )}
                    </div>

                    <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                      {scheduleBookings.length === 0 ? (
                        <div className="text-center py-10 text-xs text-slate-400 italic">No bookings found.</div>
                      ) : (
                        scheduleBookings.map((b) => (
                          <div key={b.id} className="p-4 rounded border border-slate-100 bg-slate-50 space-y-3 text-xs">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-[10px] text-slate-400 block font-bold uppercase">Booking ID</span>
                                <span className="font-mono text-[10px] font-bold">{b.id}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${b.status === 'CONFIRMED' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                {b.status}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                              <div>
                                <span className="text-slate-400 block font-bold">Seats</span>
                                <span className="font-semibold">{b.seat_numbers?.join(', ') || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block font-bold">Total Fare</span>
                                <span className="font-semibold text-emerald-600 font-mono">₹{b.total_amount || b.amount}</span>
                              </div>
                            </div>
                            {b.status === 'CONFIRMED' && (
                              <button onClick={() => handleCancelBooking(b.id)} className="w-full py-1 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded text-[10px]">Cancel Booking</button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* Operators view */}
              {fleetSubTab === 'operators' && (
                <div className="p-5 border border-slate-200 rounded-lg space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Operators List</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr>
                          <th className="p-3 text-slate-500">ID</th>
                          <th className="p-3 text-slate-500">Company Name</th>
                          <th className="p-3 text-slate-500">Contact Email</th>
                          <th className="p-3 text-slate-500">Contact Phone</th>
                          <th className="p-3 text-slate-500">GST Registration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {operators.map((op) => (
                          <tr key={op.id} className="hover:bg-slate-50">
                            <td className="p-3 font-mono text-[10px] text-slate-500">{op.id}</td>
                            <td className="p-3 font-bold">{op.name}</td>
                            <td className="p-3 font-mono">{op.contact_email}</td>
                            <td className="p-3 font-mono">{op.contact_phone}</td>
                            <td className="p-3 font-mono text-slate-650">{op.gst_number || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Buses view */}
              {fleetSubTab === 'buses' && (
                <div className="p-5 border border-slate-200 rounded-lg space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Buses Inventory</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr>
                          <th className="p-3 text-slate-500">License Plate</th>
                          <th className="p-3 text-slate-500">Category</th>
                          <th className="p-3 text-slate-500">Total Seating</th>
                          <th className="p-3 text-slate-500">Operator ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {buses.map((bus) => (
                          <tr key={bus.id} className="hover:bg-slate-50">
                            <td className="p-3 font-mono font-bold text-blue-600">{bus.registration_number}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-semibold">{bus.bus_type}</span>
                            </td>
                            <td className="p-3 font-semibold">{bus.total_seats} Seats</td>
                            <td className="p-3 font-mono text-[10px] text-slate-500">{bus.operator_id}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 4: ADVENTURES LISTINGS & UPLOADS */}
          {selectedTab === 'adventures' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Adventure Tour Catalog</h3>
                  <p className="text-[11px] text-slate-400">Upload active travel adventures and inspect listings</p>
                </div>
                <button onClick={() => setShowAddAdventureModal(true)} className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-750 flex items-center gap-1.5">
                  <Icon name="plus" /> Upload Adventure
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adventures.map((adv) => (
                  <div key={adv.id} className="p-5 border border-slate-200 rounded-lg flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">{adv.duration || `${adv.duration_days} Days`}</span>
                        <span className="text-xs font-bold text-slate-800">₹{adv.price}</span>
                      </div>
                      <h4 className="font-semibold text-slate-900">{adv.name || adv.title}</h4>
                      <div className="text-[11px] text-slate-500 leading-relaxed max-h-[100px] overflow-y-auto" dangerouslySetInnerHTML={{ __html: adv.description }} />
                    </div>
                    
                    <div className="space-y-3 pt-3 border-t border-slate-100">
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Destinations</span>
                        <span className="text-[10px] font-medium block truncate mt-0.5 text-slate-600">{Array.isArray(adv.destinations) ? adv.destinations.join(', ') : adv.location}</span>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => {
                          setEditingAdventure(adv);
                          setNewAdventure({
                            title: adv.name || adv.title || '',
                            description: adv.description || '',
                            price: adv.price || '',
                            duration_days: adv.duration_days || '',
                            duration_nights: adv.duration_nights || '',
                            destinations: Array.isArray(adv.destinations) ? adv.destinations.join(', ') : adv.location || '',
                            inclusions: Array.isArray(adv.inclusions) ? adv.inclusions.join(', ') : adv.inclusions || ''
                          });
                          setShowEditAdventureModal(true);
                        }} className="px-2.5 py-1 text-[10px] border border-slate-200 rounded hover:bg-slate-100 text-slate-500 font-semibold">Edit</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: TOUR PACKAGES LISTINGS & UPLOADS */}
          {selectedTab === 'packages' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Tour Packages Catalog</h3>
                  <p className="text-[11px] text-slate-400">Configure cataloged holiday tour packages</p>
                </div>
                <button onClick={() => setShowAddPackageModal(true)} className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-750 flex items-center gap-1.5">
                  <Icon name="plus" /> Upload Tour Package
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages.map((pkg) => (
                  <div key={pkg.id} className="p-5 border border-slate-200 rounded-lg flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">{pkg.duration_days} Days / {pkg.duration_nights} Nights</span>
                        <span className="text-xs font-bold text-slate-800">₹{pkg.price}</span>
                      </div>
                      <h4 className="font-semibold text-slate-900">{pkg.title}</h4>
                      <div className="text-[11px] text-slate-500 leading-relaxed max-h-[100px] overflow-y-auto" dangerouslySetInnerHTML={{ __html: pkg.description }} />
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-100">
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Destinations</span>
                        <span className="text-[10px] font-medium block truncate mt-0.5 text-slate-600">{Array.isArray(pkg.destinations) ? pkg.destinations.join(', ') : 'None'}</span>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => {
                          setEditingPackage(pkg);
                          setNewPackage({
                            title: pkg.title || '',
                            description: pkg.description || '',
                            price: pkg.price || '',
                            duration_days: pkg.duration_days || '',
                            duration_nights: pkg.duration_nights || '',
                            destinations: Array.isArray(pkg.destinations) ? pkg.destinations.join(', ') : '',
                            inclusions: Array.isArray(pkg.inclusions) ? pkg.inclusions.join(', ') : ''
                          });
                          setShowEditPackageModal(true);
                        }} className="px-2.5 py-1 text-[10px] border border-slate-200 rounded hover:bg-slate-100 text-slate-500 font-semibold">Edit</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: DATA EXPLORER SPREADSHEET CRUD */}
          {selectedTab === 'explorer' && (
            <div className="space-y-6">
              
              {/* Selectors and trigger commands */}
              <div className="flex justify-between items-center flex-wrap gap-4 p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 block uppercase">Microservice</label>
                    <select 
                      value={activeService} 
                      onChange={(e) => {
                        const s = e.target.value;
                        const defaultT = s === 'user-service' ? 'users' : 
                                         s === 'bus-service' ? 'schedules' : 
                                         s === 'adventure-service' ? 'adventures' : 
                                         s === 'package-service' ? 'packages' : 'bookings';
                        handleExploreTable(s, defaultT);
                      }}
                      className="bg-slate-50 border border-slate-200 text-xs rounded px-2.5 py-1 focus:outline-none"
                    >
                      {serviceOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 block uppercase">Table</label>
                    <select 
                      value={activeTable}
                      onChange={(e) => handleExploreTable(activeService, e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-xs rounded px-2.5 py-1 focus:outline-none"
                    >
                      {dbTables.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setShowImportModal(true)} className="px-3 py-1.5 border border-slate-200 rounded text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5"><Icon name="upload" /> Bulk Import</button>
                  <button onClick={() => { setNewRowData({}); setShowAddRowModal(true); }} className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-750 flex items-center gap-1.5"><Icon name="plus" /> Insert Row</button>
                </div>
              </div>

              {/* Spreadsheet records table */}
              <div className="p-5 border border-slate-200 rounded-lg space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-500">Record count: <span className="font-bold text-slate-700">{dbRowsData.total} rows</span></span>
                  
                  {/* Paginator */}
                  <div className="flex items-center gap-1.5">
                    <button 
                      disabled={dbRowsData.page === 1}
                      onClick={() => handleQueryDbRows(activeService, activeTable, dbRowsData.page - 1, dbRowsData.limit, dbFilters, dbSort)}
                      className="p-1 border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-50"
                    >
                      <Icon name="chevron-left" />
                    </button>
                    <span className="font-mono text-[10px] text-slate-500">Page {dbRowsData.page} / {dbRowsData.totalPages}</span>
                    <button 
                      disabled={dbRowsData.page === dbRowsData.totalPages}
                      onClick={() => handleQueryDbRows(activeService, activeTable, dbRowsData.page + 1, dbRowsData.limit, dbFilters, dbSort)}
                      className="p-1 border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-50"
                    >
                      <Icon name="chevron-right" />
                    </button>
                  </div>
                </div>

                {dbSchema && (
                  <div className="overflow-x-auto border border-slate-200 rounded">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr>
                          {dbSchema.columns.map(col => (
                            <th key={col.name} className="p-3 text-slate-500 cursor-pointer hover:text-slate-800" onClick={() => {
                              const nextDir = dbSort.col === col.name && dbSort.dir === 'ASC' ? 'DESC' : 'ASC';
                              const nextSort = { col: col.name, dir: nextDir };
                              setDbSort(nextSort);
                              handleQueryDbRows(activeService, activeTable, dbRowsData.page, dbRowsData.limit, dbFilters, nextSort);
                            }}>
                              <div className="flex items-center gap-1">
                                <span>{col.name}</span>
                                {dbSort.col === col.name && <Icon name={dbSort.dir === 'ASC' ? "arrow-up" : "arrow-down"} className="w-3 h-3" />}
                              </div>
                            </th>
                          ))}
                          <th className="p-3 text-slate-500 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dbRowsData.rows.map((row, idx) => {
                          const pkCol = dbSchema.primaryKeys[0];
                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              {dbSchema.columns.map(col => (
                                <td key={col.name} className="p-3 truncate max-w-xs">{row[col.name] !== null && row[col.name] !== undefined ? String(row[col.name]) : <span className="text-slate-300 italic font-normal">null</span>}</td>
                              ))}
                              <td className="p-3 text-right space-x-1">
                                <button onClick={() => { setDetailRow(row); setShowDetailModal(true); }} className="px-2 py-0.5 border border-slate-200 rounded text-[10px] hover:bg-slate-100 font-semibold">Inspect</button>
                                <button onClick={() => { setEditingRow(row); setNewRowData({ ...row }); setShowEditRowModal(true); }} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] hover:bg-blue-100 font-bold">Edit</button>
                                <button onClick={() => handleDeleteRow(row)} className="px-2 py-0.5 bg-red-50 text-red-650 rounded text-[10px] hover:bg-red-100 font-bold">Delete</button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 7: DEVELOPER UTILITIES & TOOLS */}
          {selectedTab === 'dev' && (
            <div className="space-y-6">
              
              <div className="flex gap-2 border-b border-slate-200 pb-3">
                <button onClick={() => setDevSubTab('logs')} className={`pb-2 px-3 text-xs font-bold transition-all ${devSubTab === 'logs' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}>App Logs</button>
                <button onClick={() => setDevSubTab('redis')} className={`pb-2 px-3 text-xs font-bold transition-all ${devSubTab === 'redis' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}>Redis Keys</button>
                <button onClick={() => setDevSubTab('sql')} className={`pb-2 px-3 text-xs font-bold transition-all ${devSubTab === 'sql' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}>Database SQL Terminal</button>
                <button onClick={() => setDevSubTab('env')} className={`pb-2 px-3 text-xs font-bold transition-all ${devSubTab === 'env' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}>Config Editor</button>
              </div>

              {/* Dev Subtab: App Logs */}
              {devSubTab === 'logs' && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div className="p-5 border border-slate-200 rounded-lg space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Microservice</h4>
                    <div className="space-y-1 max-h-[350px] overflow-y-auto pr-1">
                      {containers.map((c) => (
                        <button 
                          key={c.id} 
                          onClick={() => handleSubscribeLogs(c.service)}
                          className={`w-full p-2 rounded text-left text-xs font-mono font-bold flex justify-between items-center transition-all ${activeLogService === c.service ? 'bg-blue-50 text-blue-600 border border-blue-150' : 'border border-transparent hover:bg-slate-100 text-slate-600'}`}
                        >
                          <span>{c.service}</span>
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-3 p-5 border border-slate-200 rounded-lg space-y-4 flex flex-col h-[500px]">
                    <div className="flex justify-between items-center pb-2 border-b">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Terminal Log Output</h4>
                      <div className="flex items-center gap-2">
                        <input 
                          type="text" 
                          placeholder="Filter logs..." 
                          value={logFilter}
                          onChange={(e) => setLogFilter(e.target.value)}
                          className="bg-slate-50 border rounded px-2 py-0.5 text-[11px] outline-none"
                        />
                        <button onClick={() => setLogBuffer([])} className="text-[10px] text-slate-400 hover:text-slate-600 font-bold">Clear</button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto terminal-window font-mono text-[10px] leading-relaxed p-4 whitespace-pre-wrap">
                      {logBuffer
                        .filter(l => !logFilter || l.toLowerCase().includes(logFilter.toLowerCase()))
                        .map((l, i) => <div key={i} className="border-b border-slate-900/50 py-0.5">{l}</div>)}
                      <div ref={logsEndRef}></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Dev Subtab: Redis cache key list */}
              {devSubTab === 'redis' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="p-5 border border-slate-200 rounded-lg space-y-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Keys Pattern</h4>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={redisPattern} 
                          onChange={(e) => setRedisPattern(e.target.value)} 
                          className="w-full bg-slate-50 border rounded px-3 py-1 text-xs outline-none"
                          placeholder="e.g. *"
                        />
                        <button onClick={fetchRedisKeys} className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-750">Find</button>
                      </div>
                    </div>

                    <div className="space-y-1 max-h-[350px] overflow-y-auto pr-1">
                      {redisKeys.map((k) => (
                        <div 
                          key={k.key} 
                          onClick={() => setRedisKeyDetail(k)}
                          className="p-2 border border-slate-100 hover:bg-slate-50 cursor-pointer flex justify-between items-center text-xs font-mono"
                        >
                          <span className="truncate max-w-[150px] font-bold text-slate-700">{k.key}</span>
                          <span className="text-[9px] px-1 bg-slate-150 rounded uppercase">{k.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-5 border border-slate-200 rounded-lg space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Key details</h4>
                    {redisKeyDetail ? (
                      <div className="space-y-4 text-xs">
                        <div className="font-mono">
                          <span className="text-slate-450 block font-bold">Key</span>
                          <span className="font-bold text-slate-800 break-all select-all">{redisKeyDetail.key}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                          <div>
                            <span className="text-slate-450 block font-bold">Type</span>
                            <span className="font-bold">{redisKeyDetail.type}</span>
                          </div>
                          <div>
                            <span className="text-slate-450 block font-bold">TTL</span>
                            <span className="font-bold text-amber-600">{redisKeyDetail.ttl}s</span>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteRedisKey(redisKeyDetail.key)} className="w-full py-1.5 bg-red-50 text-red-600 border border-red-100 rounded font-bold hover:bg-red-100 text-[10px]">Delete Key</button>
                      </div>
                    ) : (
                      <div className="text-center py-10 text-slate-400 italic">Select key to inspect cache values</div>
                    )}
                  </div>

                  <div className="p-5 border border-slate-200 rounded-lg space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Pub/Sub Updates</h4>
                    <div className="terminal-window h-[350px] overflow-y-auto text-[10px] space-y-2">
                      {redisEvents.map((ev, i) => (
                        <div key={i} className="border-b border-slate-900/50 pb-1 font-mono">
                          <div className="text-blue-400 font-bold font-mono">[{ev.channel}]</div>
                          <div className="text-slate-300 truncate font-mono">{ev.message}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Dev Subtab: SQL query */}
              {devSubTab === 'sql' && (
                <div className="space-y-4">
                  <div className="p-5 border border-slate-200 rounded-lg space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Database SQL Terminal</h4>
                      <select 
                        value={activeService} 
                        onChange={(e) => setActiveService(e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-xs rounded px-2 py-0.5 outline-none font-mono"
                      >
                        {serviceOptions.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    <textarea 
                      value={sqlQuery} 
                      onChange={(e) => setSqlQuery(e.target.value)}
                      placeholder="SELECT * FROM users LIMIT 5;"
                      rows={5}
                      className="w-full bg-slate-50 border rounded-lg p-3 font-mono text-xs text-slate-700 outline-none focus:border-blue-600"
                    />

                    <div className="flex justify-end">
                      <button onClick={handleRunSQL} className="px-4 py-1.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-750">Execute Query</button>
                    </div>
                  </div>

                  {sqlError && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded text-xs font-mono text-red-600">{sqlError}</div>
                  )}

                  {sqlResult && (
                    <div className="p-5 border border-slate-200 rounded-lg overflow-x-auto">
                      <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Query Results</h5>
                      <pre className="text-[10px] font-mono leading-relaxed max-h-[300px] overflow-auto select-all">{JSON.stringify(sqlResult, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}

              {/* Dev Subtab: Env file editor */}
              {devSubTab === 'env' && (
                <div className="p-5 border border-slate-200 rounded-lg space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Config Editor</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block uppercase">Target Service</label>
                      <select 
                        value={selectedEnvService} 
                        onChange={(e) => setSelectedEnvService(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 w-full outline-none font-mono"
                      >
                        {serviceOptions.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block uppercase">Configuration Key</label>
                      <input 
                        type="text" 
                        value={newEnvKey} 
                        onChange={(e) => setNewEnvKey(e.target.value)}
                        placeholder="e.g. JWT_SECRET" 
                        className="w-full bg-slate-50 border rounded px-3 py-1 outline-none font-mono font-bold"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block uppercase">Variable Value</label>
                      <input 
                        type="text" 
                        value={newEnvVal} 
                        onChange={(e) => setNewEnvVal(e.target.value)}
                        placeholder="value details"
                        className="w-full bg-slate-50 border rounded px-3 py-1 outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button onClick={handleSaveEnvConfig} className="px-4 py-1.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-750">Save Variable</button>
                  </div>
                </div>
              )}

            </div>
          )}

        </main>
      </div>

      {/* AUDIT LOG DRAWER OVERLAY */}
      {showAuditLogs && (
        <aside className="fixed right-0 top-0 bottom-0 w-80 border-l border-slate-200 bg-white shadow-2xl z-50 p-5 flex flex-col h-full overflow-hidden">
          <div className="flex justify-between items-center border-b pb-3 mb-4 shrink-0">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Action Trail logs</h3>
            <button onClick={() => setShowAuditLogs(false)} className="text-slate-400 hover:text-slate-605 font-bold">✖</button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {auditLogs.map((log, idx) => (
              <div key={idx} className="p-3 rounded border border-slate-100 text-[11px] leading-relaxed">
                <div className="flex justify-between font-bold mb-1">
                  <span className="text-blue-600">{log.action}</span>
                  <span className="text-[9px] text-slate-400 font-mono font-normal">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="text-slate-600 font-mono">{log.message}</div>
              </div>
            ))}
          </div>
        </aside>
      )}

      {/* OPERATIONS SUBMODALS */}
      {/* 1. Add Schedule Modal */}
      {showAddScheduleModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="w-[450px] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">Add Schedule</h4>
              <button onClick={() => setShowAddScheduleModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✖</button>
            </div>
            <form onSubmit={handleAddSchedule} className="p-5 space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 block uppercase">Route ID</label>
                  <input type="text" value={newSchedule.route_id} onChange={(e) => setNewSchedule({ ...newSchedule, route_id: e.target.value })} className="w-full bg-slate-50 border rounded px-3 py-1 font-mono" placeholder="uuid-route" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 block uppercase">Bus ID</label>
                  <input type="text" value={newSchedule.bus_id} onChange={(e) => setNewSchedule({ ...newSchedule, bus_id: e.target.value })} className="w-full bg-slate-50 border rounded px-3 py-1 font-mono" placeholder="uuid-bus" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 block uppercase">Operator ID</label>
                  <input type="text" value={newSchedule.operator_id} onChange={(e) => setNewSchedule({ ...newSchedule, operator_id: e.target.value })} className="w-full bg-slate-50 border rounded px-3 py-1 font-mono" placeholder="uuid-operator" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 block uppercase">Date</label>
                  <input type="text" value={newSchedule.departure_date} onChange={(e) => setNewSchedule({ ...newSchedule, departure_date: e.target.value })} className="w-full bg-slate-50 border rounded px-3 py-1" placeholder="YYYY-MM-DD" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 block uppercase">Departure Time</label>
                  <input type="text" value={newSchedule.departure_time} onChange={(e) => setNewSchedule({ ...newSchedule, departure_time: e.target.value })} className="w-full bg-slate-50 border rounded px-3 py-1" placeholder="HH:MM" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 block uppercase">Arrival Time</label>
                  <input type="text" value={newSchedule.arrival_time} onChange={(e) => setNewSchedule({ ...newSchedule, arrival_time: e.target.value })} className="w-full bg-slate-50 border rounded px-3 py-1" placeholder="HH:MM" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 block uppercase">Base Fare (INR)</label>
                  <input type="number" value={newSchedule.base_fare} onChange={(e) => setNewSchedule({ ...newSchedule, base_fare: e.target.value })} className="w-full bg-slate-50 border rounded px-3 py-1" placeholder="850.00" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 block uppercase">Total Seats Available</label>
                  <input type="number" value={newSchedule.available_seats} onChange={(e) => setNewSchedule({ ...newSchedule, available_seats: e.target.value })} className="w-full bg-slate-50 border rounded px-3 py-1" placeholder="36" required />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddScheduleModal(false)} className="px-3 py-1.5 border rounded hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-750">Add Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Add Operator Modal */}
      {showAddOperatorModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="w-[450px] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">Add Operator</h4>
              <button onClick={() => setShowAddOperatorModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✖</button>
            </div>
            <form onSubmit={handleAddOperator} className="p-5 space-y-4 text-xs font-semibold">
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 block uppercase">Company Name</label>
                  <input type="text" value={newOperator.name} onChange={(e) => setNewOperator({ ...newOperator, name: e.target.value })} className="w-full bg-slate-50 border rounded px-3 py-1.5" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 block uppercase">Contact Phone</label>
                  <input type="text" value={newOperator.contact_phone} onChange={(e) => setNewOperator({ ...newOperator, contact_phone: e.target.value })} className="w-full bg-slate-50 border rounded px-3 py-1.5" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 block uppercase">Contact Email</label>
                  <input type="email" value={newOperator.contact_email} onChange={(e) => setNewOperator({ ...newOperator, contact_email: e.target.value })} className="w-full bg-slate-50 border rounded px-3 py-1.5" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 block uppercase">GST License Number</label>
                  <input type="text" value={newOperator.gst_number} onChange={(e) => setNewOperator({ ...newOperator, gst_number: e.target.value })} className="w-full bg-slate-50 border rounded px-3 py-1.5" required />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddOperatorModal(false)} className="px-3 py-1.5 border rounded hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-750">Add Operator</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Add Bus Modal */}
      {showAddBusModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="w-[450px] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">Add Bus</h4>
              <button onClick={() => setShowAddBusModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✖</button>
            </div>
            <form onSubmit={handleAddBus} className="p-5 space-y-4 text-xs font-semibold">
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 block uppercase">Operator ID</label>
                  <input type="text" value={newBus.operator_id} onChange={(e) => setNewBus({ ...newBus, operator_id: e.target.value })} className="w-full bg-slate-50 border rounded px-3 py-1.5 font-mono" placeholder="uuid-operator" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 block uppercase">Registration Plate</label>
                  <input type="text" value={newBus.registration_number} onChange={(e) => setNewBus({ ...newBus, registration_number: e.target.value })} className="w-full bg-slate-50 border rounded px-3 py-1.5 font-mono font-bold" placeholder="e.g. KA-01-AB-1234" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 block uppercase">Bus Category</label>
                    <select value={newBus.bus_type} onChange={(e) => setNewBus({ ...newBus, bus_type: e.target.value })} className="w-full bg-slate-50 border rounded px-3 py-1.5 font-semibold">
                      <option value="AC_SLEEPER">AC Sleeper</option>
                      <option value="NON_AC_SLEEPER">Non-AC Sleeper</option>
                      <option value="AC_SEATER">AC Seater</option>
                      <option value="NON_AC_SEATER">Non-AC Seater</option>
                      <option value="VOLVO_AC">Volvo AC Luxury</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 block uppercase">Seats Count</label>
                    <input type="number" value={newBus.total_seats} onChange={(e) => setNewBus({ ...newBus, total_seats: e.target.value })} className="w-full bg-slate-50 border rounded px-3 py-1.5" required />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 block uppercase">Amenities (Comma separated)</label>
                  <input type="text" value={newBus.amenities} onChange={(e) => setNewBus({ ...newBus, amenities: e.target.value })} className="w-full bg-slate-50 border rounded px-3 py-1.5" placeholder="wifi, charging" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddBusModal(false)} className="px-3 py-1.5 border rounded hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-750">Add Bus</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Add Adventure Modal */}
      {showAddAdventureModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="w-[450px] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">Upload Travel Adventure</h4>
              <button onClick={() => setShowAddAdventureModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✖</button>
            </div>
            <form onSubmit={handleAddAdventure} className="p-5 space-y-4 text-xs font-semibold">
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 block uppercase">Adventure Title</label>
                  <input type="text" value={newAdventure.title} onChange={(e) => setNewAdventure({ ...newAdventure, title: e.target.value })} className="w-full bg-slate-50 border rounded px-3 py-1.5" placeholder="e.g. Paragliding adventure" required />
                </div>
                
                {/* HTML EDITOR for description */}
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 block uppercase">Description (Rich HTML Editor)</label>
                  <RichTextEditor 
                    value={newAdventure.description} 
                    onChange={(html) => setNewAdventure({ ...newAdventure, description: html })} 
                    placeholder="Enter description with custom formatting..." 
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 block uppercase">Price (INR)</label>
                    <input type="number" value={newAdventure.price} onChange={(e) => setNewAdventure({ ...newAdventure, price: e.target.value })} className="w-full bg-slate-50 border rounded px-3 py-1.5" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 block uppercase">Days</label>
                    <input type="number" value={newAdventure.duration_days} onChange={(e) => setNewAdventure({ ...newAdventure, duration_days: e.target.value })} className="w-full bg-slate-50 border rounded px-3 py-1.5" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 block uppercase">Nights</label>
                    <input type="number" value={newAdventure.duration_nights} onChange={(e) => setNewAdventure({ ...newAdventure, duration_nights: e.target.value })} className="w-full bg-slate-50 border rounded px-3 py-1.5" required />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 block uppercase">Destinations (Comma separated)</label>
                  <input type="text" value={newAdventure.destinations} onChange={(e) => setNewAdventure({ ...newAdventure, destinations: e.target.value })} className="w-full bg-slate-50 border rounded px-3 py-1.5" placeholder="Munnar, Alleppey" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 block uppercase">Inclusions (Comma separated)</label>
                  <input type="text" value={newAdventure.inclusions} onChange={(e) => setNewAdventure({ ...newAdventure, inclusions: e.target.value })} className="w-full bg-slate-50 border rounded px-3 py-1.5" placeholder="Hotel, Transport" required />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddAdventureModal(false)} className="px-3 py-1.5 border rounded hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-750">Publish Adventure</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Add Package Modal */}
      {showAddPackageModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="w-[450px] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">Upload Tour Package</h4>
              <button onClick={() => setShowAddPackageModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✖</button>
            </div>
            <form onSubmit={handleAddPackage} className="p-5 space-y-4 text-xs font-semibold">
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 block uppercase">Package Title</label>
                  <input type="text" value={newPackage.title} onChange={(e) => setNewPackage({ ...newPackage, title: e.target.value })} className="w-full bg-slate-50 border rounded px-3 py-1.5" placeholder="e.g. Kerala Holiday Package" required />
                </div>
                
                {/* HTML EDITOR for description */}
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 block uppercase">Description (Rich HTML Editor)</label>
                  <RichTextEditor 
                    value={newPackage.description} 
                    onChange={(html) => setNewPackage({ ...newPackage, description: html })} 
                    placeholder="Enter package layout descriptions..." 
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 block uppercase">Price (INR)</label>
                    <input type="number" value={newPackage.price} onChange={(e) => setNewPackage({ ...newPackage, price: e.target.value })} className="w-full bg-slate-50 border rounded px-3 py-1.5" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 block uppercase">Days</label>
                    <input type="number" value={newPackage.duration_days} onChange={(e) => setNewPackage({ ...newPackage, duration_days: e.target.value })} className="w-full bg-slate-50 border rounded px-3 py-1.5" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 block uppercase">Nights</label>
                    <input type="number" value={newPackage.duration_nights} onChange={(e) => setNewPackage({ ...newPackage, duration_nights: e.target.value })} className="w-full bg-slate-50 border rounded px-3 py-1.5" required />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 block uppercase">Destinations (Comma separated)</label>
                  <input type="text" value={newPackage.destinations} onChange={(e) => setNewPackage({ ...newPackage, destinations: e.target.value })} className="w-full bg-slate-50 border rounded px-3 py-1.5" placeholder="Munnar, Cochin" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 block uppercase">Inclusions (Comma separated)</label>
                  <input type="text" value={newPackage.inclusions} onChange={(e) => setNewPackage({ ...newPackage, inclusions: e.target.value })} className="w-full bg-slate-50 border rounded px-3 py-1.5" placeholder="Breakfast, Transport" required />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddPackageModal(false)} className="px-3 py-1.5 border rounded hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-750">Publish Package</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Adventure Modal */}
      {showEditAdventureModal && editingAdventure && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="w-[450px] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">Edit Adventure</h4>
              <button onClick={() => setShowEditAdventureModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✖</button>
            </div>
            <form onSubmit={handleEditAdventure} className="p-5 space-y-4 text-xs font-semibold">
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 block uppercase">Adventure Title</label>
                  <input type="text" value={newAdventure.title} onChange={(e) => setNewAdventure({ ...newAdventure, title: e.target.value })} className="w-full bg-slate-50 border rounded px-3 py-1.5" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 block uppercase">Description (Rich HTML Editor)</label>
                  <RichTextEditor 
                    value={newAdventure.description} 
                    onChange={(html) => setNewAdventure({ ...newAdventure, description: html })} 
                    placeholder="Enter description with custom formatting..." 
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 block uppercase">Price (INR)</label>
                    <input type="number" value={newAdventure.price} onChange={(e) => setNewAdventure({ ...newAdventure, price: e.target.value })} className="w-full bg-slate-50 border rounded px-3 py-1.5" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 block uppercase">Days</label>
                    <input type="number" value={newAdventure.duration_days} onChange={(e) => setNewAdventure({ ...newAdventure, duration_days: e.target.value })} className="w-full bg-slate-50 border rounded px-3 py-1.5" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 block uppercase">Nights</label>
                    <input type="number" value={newAdventure.duration_nights} onChange={(e) => setNewAdventure({ ...newAdventure, duration_nights: e.target.value })} className="w-full bg-slate-50 border rounded px-3 py-1.5" required />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 block uppercase">Destinations (Comma separated)</label>
                  <input type="text" value={newAdventure.destinations} onChange={(e) => setNewAdventure({ ...newAdventure, destinations: e.target.value })} className="w-full bg-slate-50 border rounded px-3 py-1.5" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 block uppercase">Inclusions (Comma separated)</label>
                  <input type="text" value={newAdventure.inclusions} onChange={(e) => setNewAdventure({ ...newAdventure, inclusions: e.target.value })} className="w-full bg-slate-50 border rounded px-3 py-1.5" required />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowEditAdventureModal(false)} className="px-3 py-1.5 border rounded hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-750">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Package Modal */}
      {showEditPackageModal && editingPackage && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="w-[450px] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">Edit Tour Package</h4>
              <button onClick={() => setShowEditPackageModal(false)} className="text-slate-400 hover:text-slate-650 font-bold">✖</button>
            </div>
            <form onSubmit={handleEditPackage} className="p-5 space-y-4 text-xs font-semibold">
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 block uppercase">Package Title</label>
                  <input type="text" value={newPackage.title} onChange={(e) => setNewPackage({ ...newPackage, title: e.target.value })} className="w-full bg-slate-50 border rounded px-3 py-1.5" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 block uppercase">Description (Rich HTML Editor)</label>
                  <RichTextEditor 
                    value={newPackage.description} 
                    onChange={(html) => setNewPackage({ ...newPackage, description: html })} 
                    placeholder="Enter description with custom formatting..." 
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 block uppercase">Price (INR)</label>
                    <input type="number" value={newPackage.price} onChange={(e) => setNewPackage({ ...newPackage, price: e.target.value })} className="w-full bg-slate-50 border rounded px-3 py-1.5" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 block uppercase">Days</label>
                    <input type="number" value={newPackage.duration_days} onChange={(e) => setNewPackage({ ...newPackage, duration_days: e.target.value })} className="w-full bg-slate-50 border rounded px-3 py-1.5" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 block uppercase">Nights</label>
                    <input type="number" value={newPackage.duration_nights} onChange={(e) => setNewPackage({ ...newPackage, duration_nights: e.target.value })} className="w-full bg-slate-50 border rounded px-3 py-1.5" required />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 block uppercase">Destinations (Comma separated)</label>
                  <input type="text" value={newPackage.destinations} onChange={(e) => setNewPackage({ ...newPackage, destinations: e.target.value })} className="w-full bg-slate-50 border rounded px-3 py-1.5" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 block uppercase">Inclusions (Comma separated)</label>
                  <input type="text" value={newPackage.inclusions} onChange={(e) => setNewPackage({ ...newPackage, inclusions: e.target.value })} className="w-full bg-slate-50 border rounded px-3 py-1.5" required />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowEditPackageModal(false)} className="px-3 py-1.5 border rounded hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-750">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Explorer Table Data Modals */}
      {/* 6. Explorer Insert Row Modal */}
      {showAddRowModal && dbSchema && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="w-[450px] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50 shrink-0">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">Insert Row into {activeTable}</h4>
              <button onClick={() => setShowAddRowModal(false)} className="text-slate-400 hover:text-slate-650 font-bold">✖</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {dbSchema.columns.map(col => {
                const isAuto = col.isPrimaryKey && (col.defaultValue && (col.defaultValue.includes('nextval') || col.defaultValue.includes('gen_random_uuid') || col.defaultValue.includes('uuid_generate')));
                if (isAuto) return null;
                return (
                  <div key={col.name} className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 block uppercase font-mono">{col.name} {col.isPrimaryKey && '(PK)'}</label>
                    <input 
                      type="text" 
                      placeholder={col.type}
                      value={newRowData[col.name] !== undefined && newRowData[col.name] !== null ? newRowData[col.name] : ''}
                      onChange={(e) => setNewRowData({ ...newRowData, [col.name]: e.target.value === '' ? null : e.target.value })}
                      className="w-full bg-slate-50 border rounded px-3 py-1.5 text-xs font-mono text-slate-700 focus:outline-none"
                    />
                  </div>
                );
              })}
            </div>
            <div className="p-4 border-t flex justify-end gap-2 bg-slate-50 shrink-0">
              <button onClick={() => setShowAddRowModal(false)} className="px-3 py-1.5 border rounded hover:bg-slate-50 text-xs font-semibold">Cancel</button>
              <button onClick={handleCreateRow} className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-750 text-xs font-semibold">Insert Row</button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Explorer Edit Row Modal */}
      {showEditRowModal && dbSchema && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="w-[450px] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50 shrink-0">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">Update Row in {activeTable}</h4>
              <button onClick={() => setShowEditRowModal(false)} className="text-slate-400 hover:text-slate-655 font-bold">✖</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {dbSchema.columns.map(col => {
                const isPk = col.isPrimaryKey;
                return (
                  <div key={col.name} className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-450 block uppercase font-mono">{col.name} {isPk && '(PK - ReadOnly)'}</label>
                    <input 
                      type="text" 
                      disabled={isPk}
                      value={newRowData[col.name] !== null && newRowData[col.name] !== undefined ? String(newRowData[col.name]) : ''}
                      onChange={(e) => setNewRowData({ ...newRowData, [col.name]: e.target.value === '' ? null : e.target.value })}
                      className="w-full bg-slate-55 border rounded px-3 py-1.5 text-xs font-mono text-slate-700 focus:outline-none disabled:opacity-40"
                    />
                  </div>
                );
              })}
            </div>
            <div className="p-4 border-t flex justify-end gap-2 bg-slate-50 shrink-0">
              <button onClick={() => setShowEditRowModal(false)} className="px-3 py-1.5 border rounded hover:bg-slate-50 text-xs font-semibold">Cancel</button>
              <button onClick={handleUpdateRow} className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-750 text-xs font-semibold">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Explorer Inspector Details Modal */}
      {showDetailModal && detailRow && dbSchema && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="w-[500px] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50 shrink-0">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">Record Inspection: {activeTable}</h4>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-655 font-bold">✖</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="border rounded overflow-hidden divide-y divide-slate-100 font-mono text-xs">
                {dbSchema.columns.map(col => (
                  <div key={col.name} className="p-3.5 flex flex-col gap-1 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span className="font-bold font-mono">{col.name}</span>
                      <span className="font-mono uppercase">{col.type}</span>
                    </div>
                    <div className="text-slate-800 break-all select-all font-mono">
                      {detailRow[col.name] !== null && detailRow[col.name] !== undefined ? String(detailRow[col.name]) : <span className="text-slate-300 italic font-normal">null</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t flex justify-end bg-slate-50 shrink-0">
              <button onClick={() => setShowDetailModal(false)} className="px-3 py-1.5 border rounded hover:bg-slate-50 text-xs font-semibold">Close Details</button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Explorer Import Data Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="w-[500px] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50 shrink-0">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">Bulk Data Import: {activeTable}</h4>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-655 font-bold">✖</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-semibold">
              <div className="flex gap-4 border-b pb-2">
                <button onClick={() => setImportType('json')} className={`pb-1 text-xs font-semibold transition-all ${importType === 'json' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}>JSON Array</button>
                <button onClick={() => setImportType('csv')} className={`pb-1 text-xs font-semibold transition-all ${importType === 'csv' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}>CSV Format</button>
              </div>
              <div className="space-y-1">
                <textarea 
                  value={importPayload} 
                  onChange={(e) => setImportPayload(e.target.value)} 
                  placeholder={importType === 'json' ? '[\n  {\n    "name": "Jane Doe",\n    "phone": "+919876543210"\n  }\n]' : 'name,phone\nJane Doe,+919876543210'}
                  rows={8}
                  className="w-full bg-slate-50 border rounded p-3 font-mono text-xs outline-none"
                />
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2 bg-slate-50 shrink-0">
              <button onClick={() => setShowImportModal(false)} className="px-3 py-1.5 border rounded hover:bg-slate-50 text-xs font-semibold">Cancel</button>
              <button onClick={handleBulkImport} className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-750 text-xs font-semibold">Import Data</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(<App />);
