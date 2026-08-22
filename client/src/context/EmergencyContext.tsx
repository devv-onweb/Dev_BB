import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import {
  BloodGroup,
  BloodInventoryItem,
  Requisition,
  AuditLogItem,
  DashboardMetrics,
} from '../types/emergency.types';

interface EmergencyContextType {
  inventory: Record<BloodGroup, BloodInventoryItem>;
  requisitions: Requisition[];
  auditLogs: AuditLogItem[];
  metrics: DashboardMetrics;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  adjustStock: (bloodGroup: BloodGroup, delta: number, reason?: string) => void;
  createRequisition: (
    data: Omit<Requisition, 'id' | 'reqNumber' | 'status' | 'requestedAt' | 'patientId'>
  ) => void;
  fulfillRequisition: (id: string) => { success: boolean; message: string };
  cancelRequisition: (id: string) => void;
  clearAuditLogs: () => void;
  resetToDemoData: () => void;
}

const mapGroupToBackend = (group: string) => {
  return group.replace('+', '_POS').replace('-', '_NEG');
};

const mapBackendToGroup = (group: string): BloodGroup => {
  return group.replace('_POS', '+').replace('_NEG', '-') as BloodGroup;
};

const DEFAULT_INVENTORY: Record<BloodGroup, BloodInventoryItem> = {
  'A+': { bloodGroup: 'A+', units: 28, capacity: 60, minThreshold: 10, lastUpdated: new Date().toLocaleTimeString() },
  'A-': { bloodGroup: 'A-', units: 12, capacity: 30, minThreshold: 10, lastUpdated: new Date().toLocaleTimeString() },
  'B+': { bloodGroup: 'B+', units: 34, capacity: 60, minThreshold: 10, lastUpdated: new Date().toLocaleTimeString() },
  'B-': { bloodGroup: 'B-', units: 8, capacity: 30, minThreshold: 8, lastUpdated: new Date().toLocaleTimeString() },
  'O+': { bloodGroup: 'O+', units: 52, capacity: 70, minThreshold: 15, lastUpdated: new Date().toLocaleTimeString() },
  'O-': { bloodGroup: 'O-', units: 14, capacity: 40, minThreshold: 12, lastUpdated: new Date().toLocaleTimeString() },
  'AB+': { bloodGroup: 'AB+', units: 18, capacity: 40, minThreshold: 8, lastUpdated: new Date().toLocaleTimeString() },
  'AB-': { bloodGroup: 'AB-', units: 6, capacity: 25, minThreshold: 6, lastUpdated: new Date().toLocaleTimeString() },
};

const DEFAULT_REQUISITIONS: Requisition[] = [
  {
    id: 'req-pending-01',
    reqNumber: 'REQ-2026-8941',
    patientName: 'Amit Verma',
    patientId: 'PT-89412',
    ward: 'AIIMS New Delhi - Emergency Trauma Bay 3',
    bloodGroup: 'O-',
    unitsNeeded: 2,
    urgency: 'STAT_CRITICAL',
    clinicalNotes: 'Major blunt force trauma, severe hemorrhage, immediate massive transfusion protocol.',
    status: 'PENDING',
    requestedAt: new Date(Date.now() - 6 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
  {
    id: 'req-pending-02',
    reqNumber: 'REQ-2026-8940',
    patientName: 'Kavita Rao',
    patientId: 'PT-78321',
    ward: 'Apollo Hospitals Chennai - OT Room 4',
    bloodGroup: 'A-',
    unitsNeeded: 1,
    urgency: 'URGENT',
    clinicalNotes: 'Cardiothoracic bypass graft standby. Scheduled delivery in 20 mins.',
    status: 'PENDING',
    requestedAt: new Date(Date.now() - 18 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
  {
    id: 'req-103',
    reqNumber: 'REQ-2026-8939',
    patientName: 'Suresh Iyer',
    patientId: 'PT-65239',
    ward: 'Fortis Memorial Research Institute - ICU Ward 2',
    bloodGroup: 'B+',
    unitsNeeded: 3,
    urgency: 'STANDARD',
    clinicalNotes: 'Post-op hemoglobin stabilization. Target Hb > 9.5 g/dL.',
    status: 'PENDING',
    requestedAt: new Date(Date.now() - 42 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
  {
    id: 'req-104',
    reqNumber: 'REQ-2026-8935',
    patientName: 'Neha Joshi',
    patientId: 'PT-43921',
    ward: 'Tata Memorial Hospital Mumbai - Oncology Wing',
    bloodGroup: 'AB+',
    unitsNeeded: 2,
    urgency: 'STANDARD',
    clinicalNotes: 'Aplastic anemia therapeutic transfusion completed.',
    status: 'FULFILLED',
    requestedAt: new Date(Date.now() - 95 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    fulfilledAt: new Date(Date.now() - 80 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    fulfilledBy: 'Dr. Rajesh Sharma (Medical Director)',
  },
];

const DEFAULT_LOGS: AuditLogItem[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 80 * 60 * 1000).toLocaleTimeString(),
    type: 'REQUISITION_FULFILLED',
    message: 'Requisition REQ-2026-8935 fulfilled (2 units AB+ deducted)',
    details: 'Dispatched to Tata Memorial Hospital Mumbai - Patient: Neha Joshi',
    actor: 'Dr. Rajesh Sharma (Medical Director)',
    severity: 'success',
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 42 * 60 * 1000).toLocaleTimeString(),
    type: 'REQUISITION_CREATED',
    message: 'New Requisition REQ-2026-8939 logged for B+ (3 units)',
    details: 'Ward: Fortis Memorial Research Institute - Patient: Suresh Iyer',
    actor: 'AIIMS Triage Emergency Desk',
    severity: 'info',
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toLocaleTimeString(),
    type: 'SHORTAGE_ALERT',
    message: 'STOCK NOTICE: AB- inventory at 6 units',
    details: 'Minimum threshold is 6 units in Sanjeevani Central Cold Vault',
    actor: 'Telemetry Auto-Guard',
    severity: 'warning',
  },
  {
    id: 'log-4',
    timestamp: new Date(Date.now() - 6 * 60 * 1000).toLocaleTimeString(),
    type: 'REQUISITION_CREATED',
    message: '🚨 STAT CRITICAL Requisition REQ-2026-8941 logged for O- (2 units)',
    details: 'Immediate delivery requested by AIIMS Trauma Bay 3 - Patient: Amit Verma',
    actor: 'Attending Trauma Surgeon Dr. Deshmukh',
    severity: 'critical',
  },
];

const EmergencyContext = createContext<EmergencyContextType | undefined>(undefined);

export const EmergencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Inventory State
  const [inventory, setInventory] = useState<Record<BloodGroup, BloodInventoryItem>>(() => {
    const saved = localStorage.getItem('apex_blood_inventory');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse saved inventory:', e);
      }
    }
    return DEFAULT_INVENTORY;
  });

  // 2. Requisitions State
  const [requisitions, setRequisitions] = useState<Requisition[]>(() => {
    const saved = localStorage.getItem('apex_blood_requisitions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse saved requisitions:', e);
      }
    }
    return DEFAULT_REQUISITIONS;
  });

  // 3. Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(() => {
    const saved = localStorage.getItem('apex_blood_audit_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse saved audit logs:', e);
      }
    }
    return DEFAULT_LOGS;
  });

  // 4. Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString());

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('apex_blood_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('apex_blood_requisitions', JSON.stringify(requisitions));
  }, [requisitions]);

  useEffect(() => {
    localStorage.setItem('apex_blood_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Helper: Append Audit Log
  const addAuditLog = useCallback(
    (
      type: AuditLogItem['type'],
      message: string,
      details?: string,
      severity: AuditLogItem['severity'] = 'info',
      actor = 'Sanjeevani Command Operator'
    ) => {
      const newLog: AuditLogItem = {
        id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        timestamp: new Date().toLocaleTimeString(),
        type,
        message,
        details,
        actor,
        severity,
      };
      setAuditLogs((prev) => [newLog, ...prev.slice(0, 49)]);
      setLastSyncTime(new Date().toLocaleTimeString());
    },
    []
  );

  // Sync with Backend API if token exists
  useEffect(() => {
    const syncWithBackend = async () => {
      const token = localStorage.getItem('bloodbank_token');
      if (!token) return;

      try {
        const [invRes, reqRes] = await Promise.all([
          axiosClient.get('/inventory'),
          axiosClient.get('/requests?limit=50'),
        ]);

        if (invRes.data?.success && invRes.data.data?.inventory) {
          const backendInv = invRes.data.data.inventory;
          setInventory((prev) => {
            const updated = { ...prev };
            backendInv.forEach((item: any) => {
              const bg = mapBackendToGroup(item.blood_group);
              if (updated[bg]) {
                updated[bg] = {
                  ...updated[bg],
                  units: item.units_available,
                  lastUpdated: new Date().toLocaleTimeString(),
                };
              }
            });
            return updated;
          });
        }

        if (reqRes.data?.success && reqRes.data.data?.requests) {
          const backendReqs: any[] = reqRes.data.data.requests;
          setRequisitions((prev) => {
            const existingIds = new Set(prev.map((r) => r.id));
            const newMapped: Requisition[] = backendReqs
              .filter((br) => !existingIds.has(br.id))
              .map((br) => ({
                id: br.id,
                reqNumber: `REQ-2026-${br.id.slice(-4).toUpperCase()}`,
                patientName: br.requester?.name || 'Hospital Requisition',
                patientId: `PT-${br.requester_id.slice(-5).toUpperCase()}`,
                ward: br.hospital_name || 'AIIMS Emergency Trauma Bay',
                bloodGroup: mapBackendToGroup(br.blood_group),
                unitsNeeded: br.units_requested,
                urgency: br.urgency === 'URGENT' ? 'STAT_CRITICAL' : 'STANDARD',
                clinicalNotes: `Destination: ${br.hospital_name}`,
                status: br.status === 'FULFILLED' ? 'FULFILLED' : 'PENDING',
                requestedAt: new Date(br.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              }));

            return [...newMapped, ...prev];
          });
        }
      } catch (err) {
        // Silent catch for guest mode
      }
    };

    syncWithBackend();
  }, []);

  // Action: Manual Stock Adjustment (+ or -)
  const adjustStock = (bloodGroup: BloodGroup, delta: number, reason?: string) => {
    setInventory((prev) => {
      const current = prev[bloodGroup];
      const newUnits = Math.max(0, Math.min(current.capacity, current.units + delta));
      const updatedItem: BloodInventoryItem = {
        ...current,
        units: newUnits,
        lastUpdated: new Date().toLocaleTimeString(),
      };

      const actionWord = delta > 0 ? `added +${delta}` : `deducted ${delta}`;
      const logMessage = `Manual stock update: ${actionWord} unit(s) of ${bloodGroup}`;
      const details = reason
        ? `Reason: ${reason} (New Total: ${newUnits}/${current.capacity})`
        : `New Total: ${newUnits}/${current.capacity} units`;

      const severity =
        newUnits <= current.minThreshold
          ? 'critical'
          : delta < 0
          ? 'warning'
          : 'success';

      addAuditLog('STOCK_ADJUST', logMessage, details, severity);

      return {
        ...prev,
        [bloodGroup]: updatedItem,
      };
    });
  };

  // Action: Create Requisition
  const createRequisition = (
    data: Omit<Requisition, 'id' | 'reqNumber' | 'status' | 'requestedAt' | 'patientId'>
  ) => {
    const randomReqNum = `REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const randomPatientId = `PT-${Math.floor(10000 + Math.random() * 90000)}`;

    const newReq: Requisition = {
      ...data,
      id: 'req-' + Date.now(),
      reqNumber: randomReqNum,
      patientId: randomPatientId,
      status: 'PENDING',
      requestedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setRequisitions((prev) => [newReq, ...prev]);

    const isStat = data.urgency === 'STAT_CRITICAL';
    addAuditLog(
      'REQUISITION_CREATED',
      `${isStat ? '🚨 STAT CRITICAL: ' : ''}New Requisition ${randomReqNum} created for ${data.bloodGroup} (${data.unitsNeeded} units)`,
      `Ward: ${data.ward} | Patient: ${data.patientName} | Urgency: ${data.urgency}`,
      isStat ? 'critical' : data.urgency === 'URGENT' ? 'warning' : 'info',
      'Clinical Requisition Portal'
    );

    // Sync to Backend API in background
    const token = localStorage.getItem('bloodbank_token');
    if (token) {
      axiosClient
        .post('/requests', {
          blood_group: mapGroupToBackend(data.bloodGroup),
          units_requested: data.unitsNeeded,
          hospital_name: `${data.ward} - ${data.patientName}`,
          urgency: data.urgency === 'STANDARD' ? 'NORMAL' : 'URGENT',
        })
        .catch((e) => console.warn('Background sync to backend API skipped:', e.message));
    }

    // If current stock is below needed units, log a shortage warning
    const currentStock = inventory[data.bloodGroup]?.units || 0;
    if (currentStock < data.unitsNeeded) {
      addAuditLog(
        'SHORTAGE_ALERT',
        `⚠️ INSUFFICIENT STOCK WARNING for ${randomReqNum}`,
        `Requested ${data.unitsNeeded} units of ${data.bloodGroup}, but only ${currentStock} available in inventory!`,
        'critical',
        'Stock Safety Watchdog'
      );
    }
  };

  // Action: Fulfill & Deduct Requisition
  const fulfillRequisition = (id: string): { success: boolean; message: string } => {
    const targetReq = requisitions.find((r) => r.id === id);
    if (!targetReq) {
      return { success: false, message: 'Requisition not found.' };
    }

    if (targetReq.status === 'FULFILLED') {
      return { success: false, message: 'This requisition has already been fulfilled.' };
    }

    const currentStock = inventory[targetReq.bloodGroup]?.units || 0;

    // Check if sufficient units are available
    if (currentStock < targetReq.unitsNeeded) {
      const shortageMessage = `Insufficient stock: Requested ${targetReq.unitsNeeded} units of ${targetReq.bloodGroup}, but only ${currentStock} available!`;

      setRequisitions((prev) =>
        prev.map((r) => (r.id === id ? { ...r, shortageError: shortageMessage } : r))
      );

      addAuditLog(
        'SHORTAGE_ALERT',
        `Fulfillment Rejected: Stock shortage for ${targetReq.reqNumber}`,
        `Needs ${targetReq.unitsNeeded} units of ${targetReq.bloodGroup}. Available: ${currentStock}`,
        'critical',
        'Fulfillment Guard'
      );

      return { success: false, message: shortageMessage };
    }

    // Deduct stock from inventory
    setInventory((prev) => {
      const item = prev[targetReq.bloodGroup];
      const updatedUnits = item.units - targetReq.unitsNeeded;
      return {
        ...prev,
        [targetReq.bloodGroup]: {
          ...item,
          units: updatedUnits,
          lastUpdated: new Date().toLocaleTimeString(),
        },
      };
    });

    // Mark requisition as FULFILLED
    setRequisitions((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'FULFILLED',
              shortageError: undefined,
              fulfilledAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              fulfilledBy: 'Dr. Rajesh Sharma (Medical Director)',
            }
          : r
      )
    );

    // Sync fulfill to Backend API if matching backend UUID
    if (id.length > 20 && !id.startsWith('req-')) {
      axiosClient.put(`/requests/${id}/fulfill`).catch(() => {});
    }

    addAuditLog(
      'REQUISITION_FULFILLED',
      `Requisition ${targetReq.reqNumber} Fulfilled & Dispatched`,
      `Deducted ${targetReq.unitsNeeded} units of ${targetReq.bloodGroup} for ${targetReq.patientName} (${targetReq.ward})`,
      'success',
      'Dr. Rajesh Sharma (Medical Director)'
    );

    return {
      success: true,
      message: `Requisition ${targetReq.reqNumber} fulfilled! Deducted ${targetReq.unitsNeeded} units of ${targetReq.bloodGroup}.`,
    };
  };

  // Action: Cancel Requisition
  const cancelRequisition = (id: string) => {
    const targetReq = requisitions.find((r) => r.id === id);
    if (!targetReq) return;

    setRequisitions((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'CANCELLED' } : r))
    );

    if (id.length > 20 && !id.startsWith('req-')) {
      axiosClient.put(`/requests/${id}/reject`).catch(() => {});
    }

    addAuditLog(
      'SYSTEM_EVENT',
      `Requisition ${targetReq.reqNumber} Cancelled`,
      `Patient: ${targetReq.patientName} (${targetReq.bloodGroup})`,
      'warning',
      'Clinical Coordinator'
    );
  };

  // Action: Clear Audit Logs
  const clearAuditLogs = () => {
    setAuditLogs([]);
    addAuditLog('SYSTEM_EVENT', 'Audit activity log history cleared by user.', undefined, 'info');
  };

  // Action: Reset Demo Data
  const resetToDemoData = () => {
    setInventory(DEFAULT_INVENTORY);
    setRequisitions(DEFAULT_REQUISITIONS);
    setAuditLogs(DEFAULT_LOGS);
    localStorage.removeItem('apex_blood_inventory');
    localStorage.removeItem('apex_blood_requisitions');
    localStorage.removeItem('apex_blood_audit_logs');
    addAuditLog('SYSTEM_EVENT', 'System state reset to Indian clinical demo baseline.', undefined, 'info');
  };

  // Computed Metrics
  const metrics: DashboardMetrics = useMemo(() => {
    const items = Object.values(inventory);
    const totalUnits = items.reduce((sum, item) => sum + item.units, 0);
    const criticalShortageCount = items.filter((item) => item.units <= item.minThreshold).length;
    const activeRequisitions = requisitions.filter((r) => r.status === 'PENDING').length;
    const statCriticalCount = requisitions.filter(
      (r) => r.status === 'PENDING' && r.urgency === 'STAT_CRITICAL'
    ).length;

    return {
      totalUnits,
      criticalShortageCount,
      activeRequisitions,
      statCriticalCount,
      lastUpdated: lastSyncTime,
    };
  }, [inventory, requisitions, lastSyncTime]);

  return (
    <EmergencyContext.Provider
      value={{
        inventory,
        requisitions,
        auditLogs,
        metrics,
        isModalOpen,
        setIsModalOpen,
        adjustStock,
        createRequisition,
        fulfillRequisition,
        cancelRequisition,
        clearAuditLogs,
        resetToDemoData,
      }}
    >
      {children}
    </EmergencyContext.Provider>
  );
};

export const useEmergency = (): EmergencyContextType => {
  const context = useContext(EmergencyContext);
  if (!context) {
    throw new Error('useEmergency must be used within an EmergencyProvider');
  }
  return context;
};
