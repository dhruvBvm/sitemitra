import React, { useEffect } from 'react';

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layout & Auth
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';

// Shared Pages
import Loader from './components/common/Loader';
import Dashboard from './pages/Dashboard';
import SiteDetails from './pages/SiteDetails';
import UserProfile from './pages/UserProfile';
import CreateStaffForSite from './pages/CreateStaffForSite';
import AddStaffToSite from './pages/AddStaffToSite';
import AssignSites from './pages/AssignSites';

// Owner Pages
import OwnerUsers from './pages/owner/Users';
import OwnerSites from './pages/owner/Sites';
import OwnerMaterials from './pages/owner/Materials';
import CreateMaterial from './pages/owner/CreateMaterial';
import EditMaterial from './pages/owner/EditMaterial';
import CreateSite from './pages/owner/CreateSite';
import EditSite from './pages/owner/EditSite';
import EditUser from './pages/owner/EditUser';
import OwnerCreateManager from './pages/owner/CreateManager';
import OwnerCreateStaff from './pages/owner/CreateStaff';

// Manager Pages
import ManagerSites from './pages/manager/MySites';
import ManagerTeam from './pages/manager/Team';
import ManagerCreateStaff from './pages/manager/CreateStaff';

import EditTeamMember from './pages/manager/EditTeamMember';

// Staff Pages
import CreateOrder from './pages/staff/CreateOrder';
import StaffMyOrders from './pages/staff/MyOrders';
import StaffNotifications from './pages/staff/Notifications';
import StaffRequestDetail from './pages/staff/RequestDetail';

// Inventory Module
import Inventory from './pages/inventory/Inventory';
import CreateReceivedEntry from './pages/inventory/CreateReceivedEntry';
import CreateUsed from './pages/inventory/CreateUsed';
import EntriesList from './pages/inventory/EntriesList';
import Transactions from './pages/inventory/Transactions';
import MaterialHistory from './pages/inventory/MaterialHistory';
import RequestDetail from './pages/inventory/RequestDetail';
import ReceivedDetail from './pages/inventory/ReceivedDetail';
import UsedDetail from './pages/inventory/UsedDetail';

function App() {
  const { refreshSession, isInitializing } = useAuthStore();

  useEffect(() => {
    refreshSession();
    window.addEventListener('load', refreshSession);
    return () => window.removeEventListener('load', refreshSession);
  }, [refreshSession]);

  if (isInitializing) {
    return <Loader size="lg" className="mt-20" />;
  }

  return ( <>
      <Toaster 
        position="top-center" 
        containerStyle={{
          top: 20,
          left: 0,
          right: 0,
          margin: '0 auto',
          maxWidth: '428px',
          padding: '0 16px',
        }}
        toastOptions={{
          style: {
            maxWidth: '350px',
            marginBottom: '8px',
          }
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Owner Routes */}
          <Route element={<ProtectedRoute allowedRoles={['owner']} />}>
            <Route element={<Layout />}>
              <Route path="/owner/dashboard" element={<Dashboard />} />
              <Route path="/owner/sites" element={<OwnerSites />} />
              <Route path="/owner/sites/create" element={<CreateSite />} />
              <Route path="/owner/sites/edit/:id" element={<EditSite />} />
              <Route path="/owner/users" element={<OwnerUsers />} />
              <Route path="/owner/users/create-manager" element={<OwnerCreateManager />} />
              <Route path="/owner/users/create-staff" element={<OwnerCreateStaff />} />
              <Route path="/owner/inventory/:siteId" element={<Inventory />} />
              <Route path="/owner/create-order" element={<CreateOrder />} />
              <Route path="/owner/inventory/received/create" element={<CreateReceivedEntry />} />
              <Route path="/owner/inventory/used/create" element={<CreateUsed />} />
              <Route path="/owner/inventory/:siteId/material/:materialId/history" element={<MaterialHistory />} />
              <Route path="/owner/materials" element={<OwnerMaterials />} />
              <Route path="/owner/transactions" element={<Transactions />} />
            </Route>
          </Route>

          {/* Manager Routes */}
          <Route element={<ProtectedRoute allowedRoles={['manager']} />}>
            <Route element={<Layout />}>
              <Route path="/manager/dashboard" element={<Dashboard />} />
              <Route path="/manager/sites" element={<ManagerSites />} />
              <Route path="/manager/team" element={<ManagerTeam />} />
              <Route path="/manager/team/create-staff" element={<ManagerCreateStaff />} />

              <Route path="/manager/create-order" element={<CreateOrder />} />

              <Route path="/manager/inventory/:siteId" element={<Inventory />} />
              <Route path="/manager/inventory/received/create" element={<CreateReceivedEntry />} />
              <Route path="/manager/inventory/used/create" element={<CreateUsed />} />
              <Route path="/manager/inventory/entries" element={<EntriesList />} />
              <Route path="/manager/transactions" element={<Transactions />} />
              <Route path="/manager/materials" element={<OwnerMaterials />} />
              <Route path="/manager/inventory/:siteId/material/:materialId/history" element={<MaterialHistory />} />
            </Route>
          </Route>

          {/* Staff Routes */}
          <Route element={<ProtectedRoute allowedRoles={['staff']} />}>
            <Route element={<Layout />}>
              <Route path="/staff/dashboard" element={<Dashboard />} />
              <Route path="/staff/create-order" element={<CreateOrder />} />
              <Route path="/staff/requests" element={<StaffMyOrders />} />
              <Route path="/staff/requests/:id" element={<StaffRequestDetail />} />
              <Route path="/staff/notifications" element={<StaffNotifications />} />
              <Route path="/staff/inventory/:siteId" element={<Inventory />} />
              <Route path="/staff/inventory/received/create" element={<CreateReceivedEntry />} />
              <Route path="/staff/inventory/used/create" element={<CreateUsed />} />
              <Route path="/staff/inventory/:siteId/material/:materialId/history" element={<MaterialHistory />} />
              <Route path="/staff/materials" element={<OwnerMaterials />} />
            </Route>
          </Route>

          {/* Shared Routes */}
          <Route element={<ProtectedRoute allowedRoles={['owner', 'manager', 'staff']} />}>
            <Route element={<Layout />}>
              <Route path="/requests/:id" element={<RequestDetail />} />
              <Route path="/received/:id" element={<ReceivedDetail />} />
              <Route path="/used/:id" element={<UsedDetail />} />
              <Route path="/sites/:siteId" element={<SiteDetails />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/inventory/received/create" element={<CreateReceivedEntry />} />
              <Route path="/inventory/used/create" element={<CreateUsed />} />
            </Route>
          </Route>

          {/* Owner & Manager Routes */}
          <Route element={<ProtectedRoute allowedRoles={['owner', 'manager']} />}>
            <Route element={<Layout />}>
              <Route path="/materials/create" element={<CreateMaterial />} />
              <Route path="/materials/edit/:id" element={<EditMaterial />} />
              <Route path="/users/:userId" element={<UserProfile />} />
              <Route path="/owner/users/edit/:id" element={<EditUser />} />
              <Route path="/manager/team/edit/:id" element={<EditTeamMember />} />
              <Route path="/sites/:siteId/create-staff" element={<CreateStaffForSite />} />
              <Route path="/sites/:siteId/add-staff" element={<AddStaffToSite />} />
              <Route path="/users/:userId/assign-sites" element={<AssignSites />} />
            </Route>
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
