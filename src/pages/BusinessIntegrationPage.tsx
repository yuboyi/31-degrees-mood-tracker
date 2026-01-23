import React, { useMemo, useRef, useState } from 'react';
import {
  FaArrowDown,
  FaArrowUp,
  FaBars,
  FaCamera,
  FaCheck,
  FaCheckCircle,
  FaChevronLeft,
  FaChevronRight,
  FaClock,
  FaCloudUploadAlt,
  FaCogs,
  FaEnvelope,
  FaFileAlt,
  FaFilePdf,
  FaMapMarker,
  FaMinus,
  FaPaperPlane,
  FaPhone,
  FaPrint,
  FaQuestionCircle,
  FaSearch,
  FaTimes,
  FaWeibo,
  FaWeixin,
  FaWrench,
  FaYoutube,
} from 'react-icons/fa';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type IntegrationType = 'proofing' | 'aftersales';

type ProofingFormState = {
  customerName: string;
  phone: string;
  industry: string;
  salesman: string;
  model: string;
  material: string;
  deadline: string;
  description: string;
  services: string[];
};

type ProofingErrors = {
  customer?: string;
  phone?: string;
  model?: string;
  material?: string;
};

type AftersalesFormState = {
  customerName: string;
  phone: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  warranty: 'yes' | 'no';
  faultType: string;
  description: string;
  serviceType: string;
  serviceTime: string;
  address: string;
};

type AftersalesErrors = {
  customer?: string;
  phone?: string;
  model?: string;
  serialNumber?: string;
  faultType?: string;
  description?: string;
  serviceType?: string;
};

type AftersalesImage = {
  file: File;
  preview: string;
};

type ProofingOrder = {
  id: string;
  customer: string;
  model: string;
  submittedAt: string;
  status: string;
  statusClass: string;
  dotClass: string;
  progress: number;
  canDownload: boolean;
};

type AftersalesOrder = {
  id: string;
  customer: string;
  model: string;
  submittedAt: string;
  serviceType: string;
  status: string;
  statusClass: string;
  dotClass: string;
};

type OrderStatusCategory = 'pending' | 'processing' | 'completed';
type OrderStatusFilter = 'all' | OrderStatusCategory;
type StatusSummary = Record<OrderStatusCategory, number>;
type ProofingSortKey = 'submittedAt' | 'customer' | 'status' | 'progress';
type AftersalesSortKey = 'submittedAt' | 'customer' | 'status' | 'serviceType';
type SortDirection = 'asc' | 'desc';

const phoneRegex = /^1[3-9]\d{9}$/;
const allowedDesignFileExtensions = ['pdf', 'ai', 'psd'];

const proofingChartData = [
  { label: '10/1', submitted: 14, completed: 10 },
  { label: '10/4', submitted: 18, completed: 13 },
  { label: '10/8', submitted: 21, completed: 17 },
  { label: '10/12', submitted: 19, completed: 16 },
  { label: '10/16', submitted: 24, completed: 20 },
  { label: '10/20', submitted: 22, completed: 19 },
  { label: '10/24', submitted: 26, completed: 23 },
];
const initialProofingOrders: ProofingOrder[] = [
  {
    id: '#PY20231024001',
    customer: 'Shenzhen Xinhui Advertising Co., Ltd.',
    model: '31DU-2513',
    submittedAt: '2023-10-24 09:15',
    status: 'Completed',
    statusClass: 'bg-success/10 text-success',
    dotClass: 'bg-success',
    progress: 100,
    canDownload: true,
  },
  {
    id: '#PY20231023008',
    customer: 'Guangzhou Hongda Furniture Co., Ltd.',
    model: '31DU-1325',
    submittedAt: '2023-10-23 16:40',
    status: 'In Production',
    statusClass: 'bg-warning/10 text-warning',
    dotClass: 'bg-warning',
    progress: 65,
    canDownload: false,
  },
  {
    id: '#PY20231022019',
    customer: 'Foshan Jingcheng Materials Factory',
    model: '31DU-6090',
    submittedAt: '2023-10-22 11:20',
    status: 'Awaiting Review',
    statusClass: 'bg-primary/10 text-primary',
    dotClass: 'bg-primary',
    progress: 20,
    canDownload: false,
  },
  {
    id: '#PY20231021005',
    customer: 'Dongguan Artcraft Studio',
    model: '31DU-UV0604',
    submittedAt: '2023-10-21 14:05',
    status: 'In Production',
    statusClass: 'bg-warning/10 text-warning',
    dotClass: 'bg-warning',
    progress: 45,
    canDownload: false,
  },
];

const initialAftersalesOrders: AftersalesOrder[] = [
  {
    id: '#SH20231024006',
    customer: 'Shenzhen Xinhui Advertising Co., Ltd.',
    model: '31DU-2513',
    submittedAt: '2023-10-24 13:20',
    serviceType: 'On-site support',
    status: 'Assigned',
    statusClass: 'bg-primary/10 text-primary',
    dotClass: 'bg-primary',
  },
  {
    id: '#SH20231023012',
    customer: 'Dongguan Farflight Printing Plant',
    model: '31DU-1325',
    submittedAt: '2023-10-23 10:05',
    serviceType: 'Remote support',
    status: 'Resolved',
    statusClass: 'bg-success/10 text-success',
    dotClass: 'bg-success',
  },
  {
    id: '#SH20231022009',
    customer: 'Zhongshan Artcolor Workshop',
    model: '31DU-6090',
    submittedAt: '2023-10-22 09:45',
    serviceType: 'Depot repair',
    status: 'In Progress',
    statusClass: 'bg-warning/10 text-warning',
    dotClass: 'bg-warning',
  },
  {
    id: '#SH20231021003',
    customer: 'Huizhou EasyPrint Studio',
    model: '31DU-1325',
    submittedAt: '2023-10-21 08:55',
    serviceType: 'On-site support',
    status: 'Resolved',
    statusClass: 'bg-success/10 text-success',
    dotClass: 'bg-success',
  },
];

const serviceTypeOptions = [
  { value: 'onsite', label: 'On-site support' },
  { value: 'remote', label: 'Remote support' },
  { value: 'send', label: 'Depot repair' },
];

const serviceTypeLabelMap = serviceTypeOptions.reduce<Record<string, string>>(
  (accumulator, option) => {
    accumulator[option.value] = option.label;
    return accumulator;
  },
  {},
);

const proofingStatusFilterOptions: Array<{ value: OrderStatusFilter; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Awaiting review' },
  { value: 'processing', label: 'In production' },
  { value: 'completed', label: 'Completed' },
];

const aftersalesStatusFilterOptions: Array<{ value: OrderStatusFilter; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Awaiting assignment' },
  { value: 'processing', label: 'In progress' },
  { value: 'completed', label: 'Resolved' },
];

const additionalServices = [
  'Material samples',
  'Color calibration report',
  'Sample shipping',
  'Print parameter sheet',
];

const createEmptySummary = (): StatusSummary => ({
  pending: 0,
  processing: 0,
  completed: 0,
});

const categorizeProofingStatus = (status: string): OrderStatusCategory => {
  const normalized = status.toLowerCase();
  if (normalized.includes('completed')) {
    return 'completed';
  }
  if (
    normalized.includes('production') ||
    normalized.includes('processing') ||
    normalized.includes('running')
  ) {
    return 'processing';
  }
  return 'pending';
};

const categorizeAftersalesStatus = (status: string): OrderStatusCategory => {
  const normalized = status.toLowerCase();
  if (normalized.includes('resolved') || normalized.includes('completed')) {
    return 'completed';
  }
  if (normalized.includes('awaiting') && normalized.includes('assign')) {
    return 'pending';
  }
  if (normalized.includes('progress') || normalized.includes('assign') || normalized.includes('dispatch')) {
    return 'processing';
  }
  return 'pending';
};

const parseSubmittedAt = (value: string) => new Date(value.replace(' ', 'T'));

const compareStrings = (a: string, b: string) => a.localeCompare(b, 'en');

const compareNumbers = (a: number, b: number) => a - b;

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateTimeLocal = (date: Date) => {
  const datePart = formatDate(date);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${datePart}T${hours}:${minutes}`;
};

const getInitialDates = () => {
  const now = new Date();
  const today = formatDate(now);

  const defaultDeadline = new Date(now);
  defaultDeadline.setDate(defaultDeadline.getDate() + 7);

  const defaultPurchase = new Date(now);
  defaultPurchase.setFullYear(defaultPurchase.getFullYear() - 1);

  const defaultServiceTime = new Date(now);
  defaultServiceTime.setDate(defaultServiceTime.getDate() + 1);

  return {
    today,
    defaultDeadline: formatDate(defaultDeadline),
    defaultPurchase: formatDate(defaultPurchase),
    defaultServiceTime: formatDateTimeLocal(defaultServiceTime),
    minServiceTime: formatDateTimeLocal(now),
  };
};

const generateOrderNumber = (type: IntegrationType) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');

  return `${type === 'proofing' ? 'PY' : 'SH'}${year}${month}${day}${random}`;
};
const BusinessIntegrationPage: React.FC = () => {
  const initialDates = useMemo(getInitialDates, []);

  const [activeTab, setActiveTab] = useState<IntegrationType>('proofing');
  const [proofingOrders, setProofingOrders] = useState<ProofingOrder[]>(initialProofingOrders);
  const [aftersalesOrders, setAftersalesOrders] = useState<AftersalesOrder[]>(initialAftersalesOrders);

  const [proofingForm, setProofingForm] = useState<ProofingFormState>({
    customerName: '',
    phone: '',
    industry: '',
    salesman: '',
    model: '',
    material: '',
    deadline: initialDates.defaultDeadline,
    description: '',
    services: [],
  });
  const [proofingErrors, setProofingErrors] = useState<ProofingErrors>({});
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const proofingFileInputRef = useRef<HTMLInputElement | null>(null);

  const [aftersalesForm, setAftersalesForm] = useState<AftersalesFormState>({
    customerName: '',
    phone: '',
    model: '',
    serialNumber: '',
    purchaseDate: initialDates.defaultPurchase,
    warranty: 'yes',
    faultType: '',
    description: '',
    serviceType: '',
    serviceTime: initialDates.defaultServiceTime,
    address: '',
  });
  const [aftersalesErrors, setAftersalesErrors] = useState<AftersalesErrors>({});
  const [aftersalesImages, setAftersalesImages] = useState<Array<AftersalesImage | null>>(
    Array(5).fill(null),
  );
  const imageInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [proofingSearchQuery, setProofingSearchQuery] = useState('');
  const [proofingStatusFilter, setProofingStatusFilter] =
    useState<OrderStatusFilter>('all');
  const [aftersalesSearchQuery, setAftersalesSearchQuery] = useState('');
  const [aftersalesStatusFilter, setAftersalesStatusFilter] =
    useState<OrderStatusFilter>('all');
  const [proofingSort, setProofingSort] = useState<{
    key: ProofingSortKey;
    direction: SortDirection;
  }>({ key: 'submittedAt', direction: 'desc' });
  const [aftersalesSort, setAftersalesSort] = useState<{
    key: AftersalesSortKey;
    direction: SortDirection;
  }>({ key: 'submittedAt', direction: 'desc' });

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: '',
    message: '',
    orderNumber: '',
  });

  const proofingSummary = useMemo<StatusSummary>(() => {
    const summary = createEmptySummary();
    proofingOrders.forEach((order) => {
      const category = categorizeProofingStatus(order.status);
      summary[category] += 1;
    });
    return summary;
  }, [proofingOrders]);

  const aftersalesSummary = useMemo<StatusSummary>(() => {
    const summary = createEmptySummary();
    aftersalesOrders.forEach((order) => {
      const category = categorizeAftersalesStatus(order.status);
      summary[category] += 1;
    });
    return summary;
  }, [aftersalesOrders]);

  const proofingFilteredOrders = useMemo(() => {
    const normalizedQuery = proofingSearchQuery.trim().toLowerCase();
    const filtered = proofingOrders.filter((order) => {
      const matchesQuery =
        !normalizedQuery ||
        [order.id, order.customer, order.model].some((field) =>
          field.toLowerCase().includes(normalizedQuery),
        );
      const matchesStatus =
        proofingStatusFilter === 'all' ||
        categorizeProofingStatus(order.status) === proofingStatusFilter;
      return matchesQuery && matchesStatus;
    });
    const direction = proofingSort.direction === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (proofingSort.key) {
        case 'customer':
          return compareStrings(a.customer, b.customer) * direction;
        case 'status':
          return compareStrings(a.status, b.status) * direction;
        case 'progress':
          return compareNumbers(a.progress, b.progress) * direction;
        case 'submittedAt':
        default:
          return (
            compareNumbers(
              parseSubmittedAt(a.submittedAt).getTime(),
              parseSubmittedAt(b.submittedAt).getTime(),
            ) * direction
          );
      }
    });
  }, [proofingOrders, proofingSearchQuery, proofingStatusFilter, proofingSort]);

  const aftersalesFilteredOrders = useMemo(() => {
    const normalizedQuery = aftersalesSearchQuery.trim().toLowerCase();
    const filtered = aftersalesOrders.filter((order) => {
      const matchesQuery =
        !normalizedQuery ||
        [order.id, order.customer, order.model, order.serviceType].some((field) =>
          field.toLowerCase().includes(normalizedQuery),
        );
      const matchesStatus =
        aftersalesStatusFilter === 'all' ||
        categorizeAftersalesStatus(order.status) === aftersalesStatusFilter;
      return matchesQuery && matchesStatus;
    });
    const direction = aftersalesSort.direction === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (aftersalesSort.key) {
        case 'customer':
          return compareStrings(a.customer, b.customer) * direction;
        case 'status':
          return compareStrings(a.status, b.status) * direction;
        case 'serviceType':
          return compareStrings(a.serviceType, b.serviceType) * direction;
        case 'submittedAt':
        default:
          return (
            compareNumbers(
              parseSubmittedAt(a.submittedAt).getTime(),
              parseSubmittedAt(b.submittedAt).getTime(),
            ) * direction
          );
      }
    });
  }, [aftersalesOrders, aftersalesSearchQuery, aftersalesStatusFilter, aftersalesSort]);

  const proofingResultCount = proofingFilteredOrders.length;
  const proofingTotalCount = proofingOrders.length;
  const aftersalesResultCount = aftersalesFilteredOrders.length;
  const aftersalesTotalCount = aftersalesOrders.length;
  const toggleProofingSort = (key: ProofingSortKey) => {
    setProofingSort((previous) =>
      previous.key === key
        ? { key, direction: previous.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' },
    );
  };
  const toggleAftersalesSort = (key: AftersalesSortKey) => {
    setAftersalesSort((previous) =>
      previous.key === key
        ? { key, direction: previous.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' },
    );
  };
  const getSortIndicator = (
    currentKey: string,
    targetKey: string,
    direction: SortDirection,
  ) => {
    if (currentKey !== targetKey) {
      return null;
    }
    return direction === 'asc' ? '▲' : '▼';
  };
  const renderSortButton = <K extends string>(
    label: string,
    key: K,
    activeSort: { key: string; direction: SortDirection },
    onToggle: (targetKey: K) => void,
  ) => {
    const indicator = getSortIndicator(activeSort.key, key, activeSort.direction);
    return (
      <button
        type="button"
        className="flex items-center gap-1 text-left font-semibold text-gray-600 transition-colors hover:text-primary focus:outline-none"
        onClick={() => onToggle(key)}
      >
        <span>{label}</span>
        {indicator && <span className="text-[0.65rem]">{indicator}</span>}
      </button>
    );
  };
  const handleTabChange = (tab: IntegrationType) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const updateProofingForm = <K extends keyof ProofingFormState>(
    field: K,
    value: ProofingFormState[K],
  ) => {
    setProofingForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleProofingService = (service: string) => {
    setProofingForm((prev) => {
      const exists = prev.services.includes(service);
      return {
        ...prev,
        services: exists
          ? prev.services.filter((item) => item !== service)
          : [...prev.services, service],
      };
    });
  };

  const updateAftersalesForm = <K extends keyof AftersalesFormState>(
    field: K,
    value: AftersalesFormState[K],
  ) => {
    setAftersalesForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDesignFileSelection = (file: File | null) => {
    if (!file) {
      setDesignFile(null);
      if (proofingFileInputRef.current) {
        proofingFileInputRef.current.value = '';
      }
      return;
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedDesignFileExtensions.includes(extension)) {
      window.alert('Please upload a PDF, AI, or PSD file.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      window.alert('Each file must be 50MB or smaller.');
      return;
    }

    setDesignFile(file);
  };

  const handleProofingFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleDesignFileSelection(file);
    }
  };

  const handleAftersalesImageChange = (index: number, files: FileList | null) => {
    if (!files || !files[0]) {
      return;
    }

    const file = files[0];
    const preview = URL.createObjectURL(file);

    setAftersalesImages((prev) => {
      const next = [...prev];
      const existing = next[index];
      if (existing) {
        URL.revokeObjectURL(existing.preview);
      }
      next[index] = { file, preview };
      return next;
    });
  };

  const clearAftersalesImage = (index: number) => {
    setAftersalesImages((prev) => {
      const next = [...prev];
      const existing = next[index];
      if (existing) {
        URL.revokeObjectURL(existing.preview);
      }
      next[index] = null;
      return next;
    });

    const input = imageInputRefs.current[index];
    if (input) {
      input.value = '';
    }
  };

  const validateProofingForm = () => {
    const errors: ProofingErrors = {};
    let isValid = true;

    if (!proofingForm.customerName.trim()) {
      errors.customer = 'Customer name is required.';
      isValid = false;
    }

    if (!phoneRegex.test(proofingForm.phone.trim())) {
      errors.phone = 'Please enter a valid phone number.';
      isValid = false;
    }

    if (!proofingForm.model) {
      errors.model = 'Please select a printer model.';
      isValid = false;
    }

    if (!proofingForm.material) {
      errors.material = 'Please select a material.';
      isValid = false;
    }

    setProofingErrors(errors);
    return isValid;
  };

  const validateAftersalesForm = () => {
    const errors: AftersalesErrors = {};
    let isValid = true;

    if (!aftersalesForm.customerName.trim()) {
      errors.customer = 'Customer name is required.';
      isValid = false;
    }

    if (!phoneRegex.test(aftersalesForm.phone.trim())) {
      errors.phone = 'Please enter a valid phone number.';
      isValid = false;
    }

    if (!aftersalesForm.model) {
      errors.model = 'Please select a device model.';
      isValid = false;
    }

    if (!aftersalesForm.serialNumber.trim()) {
      errors.serialNumber = 'Serial number is required.';
      isValid = false;
    }

    if (!aftersalesForm.faultType.trim()) {
      errors.faultType = 'Please describe the fault type.';
      isValid = false;
    }

    if (!aftersalesForm.description.trim()) {
      errors.description = 'Please provide a fault description.';
      isValid = false;
    }

    if (!aftersalesForm.serviceType) {
      errors.serviceType = 'Please choose a service type.';
      isValid = false;
    }

    setAftersalesErrors(errors);
    return isValid;
  };

  const resetProofingForm = () => {
    setProofingForm({
      customerName: '',
      phone: '',
      industry: '',
      salesman: '',
      model: '',
      material: '',
      deadline: initialDates.defaultDeadline,
      description: '',
      services: [],
    });
    setProofingErrors({});
    setDesignFile(null);
    if (proofingFileInputRef.current) {
      proofingFileInputRef.current.value = '';
    }
  };

  const resetAftersalesForm = () => {
    setAftersalesForm({
      customerName: '',
      phone: '',
      model: '',
      serialNumber: '',
      purchaseDate: initialDates.defaultPurchase,
      warranty: 'yes',
      faultType: '',
      description: '',
      serviceType: '',
      serviceTime: initialDates.defaultServiceTime,
      address: '',
    });
    setAftersalesErrors({});
    setAftersalesImages((prev) => {
      prev.forEach((image) => image && URL.revokeObjectURL(image.preview));
      return Array(5).fill(null);
    });
  };

  const simulateIntegration = async (type: IntegrationType) => {
    const payload =
      type === 'proofing'
        ? {
            ...proofingForm,
            hasFile: Boolean(designFile),
          }
        : {
            ...aftersalesForm,
            imageCount: aftersalesImages.filter(Boolean).length,
            warranty: aftersalesForm.warranty === 'yes',
          };

    console.groupCollapsed(
      `Submitting ${type === 'proofing' ? 'proofing' : 'aftersales'} data to integration API...`,
    );
    console.log('Payload:', payload);
    console.groupEnd();

    await new Promise((resolve) => setTimeout(resolve, 800));
    await new Promise((resolve) => setTimeout(resolve, 900));

    return {
      success: true,
      orderNumber: generateOrderNumber(type),
    };
  };

  const handleSubmit = async (type: IntegrationType) => {
    const isValid =
      type === 'proofing' ? validateProofingForm() : validateAftersalesForm();
    if (!isValid) {
      return;
    }

    setIsLoading(true);
    const result = await simulateIntegration(type);
    setIsLoading(false);

    if (!result.success) {
      window.alert('Submission failed. Please try again later.');
      return;
    }

    const now = new Date();
    const submittedAt = `${formatDate(now)} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes(),
    ).padStart(2, '0')}`;

    if (type === 'proofing') {
      const newOrder: ProofingOrder = {
        id: result.orderNumber,
        customer: proofingForm.customerName || 'No customer name',
        model: proofingForm.model || 'Pending model',
        submittedAt,
        status: 'Awaiting Review',
        statusClass: 'bg-primary/10 text-primary',
        dotClass: 'bg-primary',
        progress: 15,
        canDownload: false,
      };
      setProofingOrders((prev) => [newOrder, ...prev]);
      setModalContent({
        title: 'Proofing request submitted',
        message: 'We received your proofing request and will contact you shortly.',
        orderNumber: newOrder.id,
      });
      resetProofingForm();
    } else {
      const newOrder: AftersalesOrder = {
        id: result.orderNumber,
        customer: aftersalesForm.customerName || 'No customer name',
        model: aftersalesForm.model || 'Pending model',
        submittedAt,
        serviceType:
          serviceTypeLabelMap[aftersalesForm.serviceType] || 'Pending selection',
        status: 'Awaiting Assignment',
        statusClass: 'bg-warning/10 text-warning',
        dotClass: 'bg-warning',
      };
      setAftersalesOrders((prev) => [newOrder, ...prev]);
      setModalContent({
        title: 'Service request submitted',
        message: 'Your aftersales request is in queue. A technician will reach out soon.',
        orderNumber: newOrder.id,
      });
      resetAftersalesForm();
    }

    setIsSuccessModalOpen(true);
  };
  return (
    <div className="bg-gray-50">
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center text-2xl font-bold text-primary">
                <FaPrint className="mr-2" />
                <span>UV Integration Center</span>
              </div>
              <nav className="hidden md:ml-10 md:flex md:space-x-8">
                <a
                  href="#"
                  className="border-b-2 border-primary px-1 pt-1 font-medium text-primary"
                >
                  Integrations
                </a>
                <a
                  href="#"
                  className="px-1 pt-1 font-medium text-gray-500 transition-colors hover:text-primary"
                >
                  Products
                </a>
                <a
                  href="#"
                  className="px-1 pt-1 font-medium text-gray-500 transition-colors hover:text-primary"
                >
                  Tech Docs
                </a>
                <a
                  href="#"
                  className="px-1 pt-1 font-medium text-gray-500 transition-colors hover:text-primary"
                >
                  About
                </a>
              </nav>
            </div>
            <div className="flex items-center">
              <button className="mr-6 hidden items-center text-gray-500 transition-colors hover:text-primary md:flex">
                <FaQuestionCircle className="mr-1" />
                Help Center
              </button>
              <div className="hidden items-center rounded-full bg-gray-100 px-3 py-1.5 md:flex">
                <img
                  src="https://picsum.photos/id/1005/32/32"
                  alt="User avatar"
                  className="mr-2 h-6 w-6 rounded-full"
                />
                <span className="text-sm">Alex Chen</span>
              </div>
              <button className="ml-4 text-gray-500 transition-colors hover:text-primary md:hidden">
                <FaBars className="text-xl" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto flex min-h-screen flex-col px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="mb-3 text-[clamp(1.8rem,4vw,2.5rem)] font-bold text-dark">
            Business Integration Console
          </h1>
          <p className="mx-auto max-w-2xl text-gray-500">
            Submit proofing and aftersales workflows, track progress in real time, and keep your operations in sync with internal systems.
          </p>
        </div>

        <div className="mb-10 border-b border-gray-200">
          <div className="flex space-x-8 overflow-x-auto md:overflow-visible">
            <button
              type="button"
              onClick={() => handleTabChange('proofing')}
              className={`whitespace-nowrap border-b-2 px-1 py-4 font-medium transition-colors ${
                activeTab === 'proofing'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-primary'
              }`}
            >
              <span className="inline-flex items-center">
                <FaFileAlt className="mr-2" />
                Proofing
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('aftersales')}
              className={`whitespace-nowrap border-b-2 px-1 py-4 font-medium transition-colors ${
                activeTab === 'aftersales'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-primary'
              }`}
            >
              <span className="inline-flex items-center">
                <FaWrench className="mr-2" />
                Aftersales
              </span>
            </button>
          </div>
        </div>

        {activeTab === 'proofing' ? (
          <section className="space-y-10">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="card-hover rounded-xl border-l-4 border-primary bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="mb-1 text-sm text-gray-500">Pending approvals</p>
                    <h3 className="text-3xl font-bold">{proofingSummary.pending}</h3>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <FaClock />
                  </div>
                </div>
                <div className="mt-4 text-sm text-success">
                  <FaArrowUp className="inline-block" /> Up 3 requests this week
                </div>
              </div>
              <div className="card-hover rounded-xl border-l-4 border-warning bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="mb-1 text-sm text-gray-500">Active proofing jobs</p>
                    <h3 className="text-3xl font-bold">{proofingSummary.processing}</h3>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10 text-warning">
                    <FaCogs />
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  <FaMinus className="inline-block" /> No change vs. yesterday
                </div>
              </div>
              <div className="card-hover rounded-xl border-l-4 border-success bg-white p-6 shadow-sm">
                <div className="flex items-start justify之间">
                  <div>
                    <p className="mb-1 text-sm text-gray-500">Completed proofing</p>
                    <h3 className="text-3xl font-bold">{proofingSummary.completed}</h3>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10 text-success">
                    <FaCheckCircle />
                  </div>
                </div>
                <div className="mt-4 text-sm text-success">
                  <FaArrowUp className="inline-block" /> Completion rate up 6%
                </div>
              </div>
            </div>

            <div className="card-hover rounded-xl bg-white p-6 shadow-sm md:p-8">
              <h2 className="mb-6 text-xl font-bold md:text-2xl">Submit proofing request</h2>
              <form className="space-y-6" onSubmit={(event) => event.preventDefault()}>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Customer name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter customer name"
                      value={proofingForm.customerName}
                      onChange={(event) =>
                        updateProofingForm('customerName', event.target.value)
                      }
                    />
                    {proofingErrors.customer && (
                      <p className="mt-1 text-xs text-danger">{proofingErrors.customer}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Contact phone <span className="text-danger">*</span>
                    </label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="Enter phone number"
                      value={proofingForm.phone}
                      onChange={(event) =>
                        updateProofingForm('phone', event.target.value)
                      }
                    />
                    {proofingErrors.phone && (
                      <p className="mt-1 text-xs text-danger">{proofingErrors.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Industry
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Optional industry information"
                      value={proofingForm.industry}
                      onChange={(event) =>
                        updateProofingForm('industry', event.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Account manager
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Optional sales contact"
                      value={proofingForm.salesman}
                      onChange={(event) =>
                        updateProofingForm('salesman', event.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Printer model <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-input"
                      value={proofingForm.model}
                      onChange={(event) =>
                        updateProofingForm('model', event.target.value)
                      }
                    >
                      <option value="">Select a printer</option>
                      <option value="31DU-2513">31DU-2513 industrial UV printer</option>
                      <option value="31DU-1325">31DU-1325 mid-size UV printer</option>
                      <option value="31DU-6090">31DU-6090 compact UV printer</option>
                      <option value="31DU-UV0604">31DU-UV0604 desktop UV printer</option>
                    </select>
                    {proofingErrors.model && (
                      <p className="mt-1 text-xs text-danger">{proofingErrors.model}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Material <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-input"
                      value={proofingForm.material}
                      onChange={(event) =>
                        updateProofingForm('material', event.target.value)
                      }
                    >
                      <option value="">Select material</option>
                      <option value="glass">Glass</option>
                      <option value="metal">Metal</option>
                      <option value="wood">Wood</option>
                      <option value="acrylic">Acrylic</option>
                      <option value="stone">Stone</option>
                      <option value="other">Other</option>
                    </select>
                    {proofingErrors.material && (
                      <p className="mt-1 text-xs text-danger">{proofingErrors.material}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Target completion date
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      min={initialDates.today}
                      value={proofingForm.deadline}
                      onChange={(event) =>
                        updateProofingForm('deadline', event.target.value)
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Requirements overview
                  </label>
                  <textarea
                    rows={3}
                    className="form-input"
                    placeholder="Share size, finish, color matching or other details"
                    value={proofingForm.description}
                    onChange={(event) =>
                      updateProofingForm('description', event.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Upload design file{' '}
                    <span className="text-xs text-gray-500">
                      (PDF, AI, or PSD, up to 50MB)
                    </span>
                  </label>
                  <div
                    onDragOver={(event) => {
                      event.preventDefault();
                      setIsDragActive(true);
                    }}
                    onDragLeave={() => setIsDragActive(false)}
                    onDrop={handleProofingFileDrop}
                    className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                      isDragActive ? 'border-primary' : 'border-gray-300'
                    } hover:border-primary`}
                  >
                    <input
                      ref={proofingFileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.ai,.psd"
                      onChange={(event) =>
                        handleDesignFileSelection(event.target.files?.[0] ?? null)
                      }
                    />
                    <label className="flex cursor-pointer flex-col items-center justify-center">
                      <FaCloudUploadAlt className="mb-2 text-3xl text-gray-400" />
                      <p className="mb-1 text-gray-500">Click or drop file to upload</p>
                      <p className="text-xs text-gray-500">Single file up to 50MB</p>
                    </label>
                  </div>
                  {designFile && (
                    <div className="mt-3">
                      <div className="flex items-center rounded bg-gray-50 p-2">
                        <FaFilePdf className="mr-2 text-danger" />
                        <span className="flex-1 text-sm">{designFile.name}</span>
                        <button
                          type="button"
                          className="text-gray-400 transition-colors hover:text-danger"
                          onClick={() => handleDesignFileSelection(null)}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="mb-3 text-lg font-semibold">Optional services</h3>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {additionalServices.map((service) => (
                      <label key={service} className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          checked={proofingForm.services.includes(service)}
                          onChange={() => toggleProofingService(service)}
                        />
                        <span className="ml-2 text-gray-700">{service}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col space-y-3 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end sm:space-y-0 sm:space-x-4">
                  <button
                    type="button"
                    className="rounded-md border border-gray-300 px-6 py-2 transition-colors hover:bg-gray-50"
                    onClick={() => window.alert('Draft saved locally.')}
                  >
                    Save draft
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-center rounded-md bg-primary px-6 py-2 text-white transition-colors hover:bg-primary/90"
                    onClick={() => handleSubmit('proofing')}
                  >
                    <FaPaperPlane className="mr-2" />
                    Submit request
                  </button>
                </div>
              </form>
            </div>

            <div className="card-hover rounded-xl bg-white p-6 shadow-sm md:p-8">
              <div className="mb-6 flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
                <h2 className="text-xl font-bold md:text-2xl">Proofing dashboard</h2>
                <div className="mt-3 flex w-full flex-col gap-3 sm:flex-row sm:items-end sm:w-auto md:mt-0">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <select
                      className="form-input"
                      value={proofingStatusFilter}
                      onChange={(event) =>
                        setProofingStatusFilter(event.target.value as OrderStatusFilter)
                      }
                    >
                      {proofingStatusFilterOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search by ID, customer, or model"
                        className="form-input pl-9"
                        value={proofingSearchQuery}
                        onChange={(event) => setProofingSearchQuery(event.target.value)}
                      />
                      <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="whitespace-nowrap rounded-md bg-primary px-6 py-2 text-white transition-colors hover:bg-primary/90"
                    onClick={() => {
                      setProofingSearchQuery('');
                      setProofingStatusFilter('all');
                    }}
                  >
                    Reset filters
                  </button>
                </div>
              </div>

              <div className="mb-8 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={proofingChartData}>
                    <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="submitted"
                      name="Submitted"
                      stroke="#165DFF"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      name="Completed"
                      stroke="#52C41A"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="bg-gray-50 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Order ID
                      </th>
                      <th className="bg-gray-50 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        {renderSortButton('Customer', 'customer', proofingSort, toggleProofingSort)}
                      </th>
                      <th className="bg-gray-50 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Printer
                      </th>
                      <th className="bg-gray-50 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        {renderSortButton(
                          'Submitted at',
                          'submittedAt',
                          proofingSort,
                          toggleProofingSort,
                        )}
                      </th>
                      <th className="bg-gray-50 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        {renderSortButton('Status', 'status', proofingSort, toggleProofingSort)}
                      </th>
                      <th className="bg-gray-50 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        {renderSortButton('Progress', 'progress', proofingSort, toggleProofingSort)}
                      </th>
                      <th className="bg-gray-50 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {proofingFilteredOrders.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                          No records match the filters.
                        </td>
                      </tr>
                    )}
                    {proofingFilteredOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-primary">
                          {order.id}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">
                          {order.customer}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">
                          {order.model}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">
                          {order.submittedAt}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2 text-xs font-semibold leading-5 ${order.statusClass}`}
                          >
                            <span className={`status-dot ${order.dotClass}`} />
                            {order.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <div className="progress-bar w-32">
                            <div
                              className="progress-value bg-success"
                              style={{ width: `${order.progress}%` }}
                            />
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-primary">
                          <button type="button" className="mr-3 hover:underline">
                            Details
                          </button>
                          {order.canDownload ? (
                            <button type="button" className="hover:underline">
                              Download report
                            </button>
                          ) : (
                            <span className="cursor-not-allowed text-gray-400">Download report</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div className="text-sm text-gray-500">
                  Showing {proofingResultCount} of {proofingTotalCount} proofing orders
                </div>
                <div className="flex space-x-1">
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 text-gray-400 transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
                    disabled
                  >
                    <FaChevronLeft className="text-xs" />
                  </button>
                  <button className="flex h-8 w-8 items-center justify-center rounded border border-primary bg-primary text-white">
                    1
                  </button>
                  <button className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 transition-colors hover:border-primary hover:text-primary">
                    2
                  </button>
                  <button className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 transition-colors hover:border-primary hover:text-primary">
                    3
                  </button>
                  <button className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 text-gray-400 transition-colors hover:border-primary hover:text-primary">
                    <FaChevronRight className="text-xs" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="space-y-10">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="card-hover rounded-xl border-l-4 border-primary bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="mb-1 text-sm text-gray-500">Awaiting assignment</p>
                    <h3 className="text-3xl font-bold">{aftersalesSummary.pending}</h3>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <FaClock />
                  </div>
                </div>
                <div className="mt-4 text-sm text-danger">
                  <FaArrowDown className="inline-block" /> Review SLA for pending tickets
                </div>
              </div>
              <div className="card-hover rounded-xl border-l-4 border-warning bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="mb-1 text-sm text-gray-500">Work in progress</p>
                    <h3 className="text-3xl font-bold">{aftersalesSummary.processing}</h3>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10 text-warning">
                    <FaWrench />
                  </div>
                </div>
                <div className="mt-4 text-sm text-success">
                  <FaArrowUp className="inline-block" /> Response time improved this week
                </div>
              </div>
              <div className="card-hover rounded-xl border-l-4 border-success bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="mb-1 text-sm text-gray-500">Resolved tickets</p>
                    <h3 className="text-3xl font-bold">{aftersalesSummary.completed}</h3>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10 text-success">
                    <FaCheckCircle />
                  </div>
                </div>
                <div className="mt-4 text-sm text-success">
                  <FaArrowUp className="inline-block" /> Customer satisfaction at 4.9/5
                </div>
              </div>
            </div>

            <div className="card-hover rounded-xl bg-white p-6 shadow-sm md:p-8">
              <h2 className="mb-6 text-xl font-bold md:text-2xl">Submit service request</h2>
              <form className="space-y-6" onSubmit={(event) => event.preventDefault()}>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Customer name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter customer name"
                      value={aftersalesForm.customerName}
                      onChange={(event) =>
                        updateAftersalesForm('customerName', event.target.value)
                      }
                    />
                    {aftersalesErrors.customer && (
                      <p className="mt-1 text-xs text-danger">{aftersalesErrors.customer}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Contact phone <span className="text-danger">*</span>
                    </label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="Enter phone number"
                      value={aftersalesForm.phone}
                      onChange={(event) =>
                        updateAftersalesForm('phone', event.target.value)
                      }
                    />
                    {aftersalesErrors.phone && (
                      <p className="mt-1 text-xs text-danger">{aftersalesErrors.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Device model <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-input"
                      value={aftersalesForm.model}
                      onChange={(event) =>
                        updateAftersalesForm('model', event.target.value)
                      }
                    >
                      <option value="">Select a device</option>
                      <option value="31DU-2513">31DU-2513 industrial UV printer</option>
                      <option value="31DU-1325">31DU-1325 mid-size UV printer</option>
                      <option value="31DU-6090">31DU-6090 compact UV printer</option>
                      <option value="31DU-UV0604">31DU-UV0604 desktop UV printer</option>
                    </select>
                    {aftersalesErrors.model && (
                      <p className="mt-1 text-xs text-danger">{aftersalesErrors.model}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Serial number <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter device serial number"
                      value={aftersalesForm.serialNumber}
                      onChange={(event) =>
                        updateAftersalesForm('serialNumber', event.target.value)
                      }
                    />
                    {aftersalesErrors.serialNumber && (
                      <p className="mt-1 text-xs text-danger">
                        {aftersalesErrors.serialNumber}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Purchase date
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      value={aftersalesForm.purchaseDate}
                      onChange={(event) =>
                        updateAftersalesForm('purchaseDate', event.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Under warranty?
                    </label>
                    <select
                      className="form-input"
                      value={aftersalesForm.warranty}
                      onChange={(event) =>
                        updateAftersalesForm('warranty', event.target.value as 'yes' | 'no')
                      }
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Issue type <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Brief issue summary"
                      value={aftersalesForm.faultType}
                      onChange={(event) =>
                        updateAftersalesForm('faultType', event.target.value)
                      }
                    />
                    {aftersalesErrors.faultType && (
                      <p className="mt-1 text-xs text-danger">{aftersalesErrors.faultType}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Issue description <span className="text-danger">*</span>
                    </label>
                    <textarea
                      rows={3}
                      className="form-input"
                      placeholder="Describe the error codes, symptoms, or steps to reproduce"
                      value={aftersalesForm.description}
                      onChange={(event) =>
                        updateAftersalesForm('description', event.target.value)
                      }
                    />
                    {aftersalesErrors.description && (
                      <p className="mt-1 text-xs text-danger">
                        {aftersalesErrors.description}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-lg font-semibold">Attach diagnostic photos</h3>
                  <p className="mb-3 text-sm text-gray-500">Up to five JPG/PNG images</p>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                    {aftersalesImages.map((image, index) => (
                      <div
                        key={index}
                        className="flex h-28 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-4 transition-colors hover:border-primary"
                        onClick={() => imageInputRefs.current[index]?.click()}
                      >
                        {image ? (
                          <div className="relative h-full w-full">
                            <img
                              src={image.preview}
                              alt="Upload preview"
                              className="h-full w-full rounded object-cover"
                            />
                            <button
                              type="button"
                              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black bg-opacity-50 text-white transition-colors hover:bg-opacity-70"
                              onClick={(event) => {
                                event.stopPropagation();
                                clearAftersalesImage(index);
                              }}
                            >
                              <FaTimes className="text-xs" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <input
                              ref={(element) => {
                                imageInputRefs.current[index] = element;
                              }}
                              type="file"
                              className="hidden"
                              accept=".jpg,.jpeg,.png"
                              onChange={(event) =>
                                handleAftersalesImageChange(index, event.target.files)
                              }
                            />
                            <FaCamera className="mb-1 text-xl text-gray-400" />
                            <p className="text-xs text-gray-500">Click to upload</p>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Service preferences</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Preferred service mode <span className="text-danger">*</span>
                      </label>
                      <div className="space-y-2">
                        {serviceTypeOptions.map((option) => (
                          <label key={option.value} className="flex items-center">
                            <input
                              type="radio"
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              name="service-type"
                              value={option.value}
                              checked={aftersalesForm.serviceType === option.value}
                              onChange={(event) =>
                                updateAftersalesForm('serviceType', event.target.value)
                              }
                            />
                            <span className="ml-2 text-gray-700">{option.label}</span>
                          </label>
                        ))}
                      </div>
                      {aftersalesErrors.serviceType && (
                        <p className="mt-1 text-xs text-danger">
                          {aftersalesErrors.serviceType}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Requested service time <span className="text-danger">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        className="form-input"
                        min={initialDates.minServiceTime}
                        value={aftersalesForm.serviceTime}
                        onChange={(event) =>
                          updateAftersalesForm('serviceTime', event.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      On-site address (if applicable)
                    </label>
                    <textarea
                      rows={2}
                      className="form-input"
                      placeholder="Enter address for on-site service"
                      value={aftersalesForm.address}
                      onChange={(event) =>
                        updateAftersalesForm('address', event.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-3 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end sm:space-y-0 sm:space-x-4">
                  <button
                    type="button"
                    className="rounded-md border border-gray-300 px-6 py-2 transition-colors hover:bg-gray-50"
                    onClick={() => window.alert('Draft saved locally.')}
                  >
                    Save draft
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-center rounded-md bg-primary px-6 py-2 text-white transition-colors hover:bg-primary/90"
                    onClick={() => handleSubmit('aftersales')}
                  >
                    <FaPaperPlane className="mr-2" />
                    Submit request
                  </button>
                </div>
              </form>
            </div>
            <div className="card-hover rounded-xl bg-white p-6 shadow-sm md:p-8">
              <div className="mb-6 flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
                <h2 className="text-xl font-bold md:text-2xl">Aftersales dashboard</h2>
                <div className="mt-3 flex w-full flex-col gap-3 sm:flex-row sm:items-end sm:w-auto md:mt-0">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <select
                      className="form-input"
                      value={aftersalesStatusFilter}
                      onChange={(event) =>
                        setAftersalesStatusFilter(event.target.value as OrderStatusFilter)
                      }
                    >
                      {aftersalesStatusFilterOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search by ticket ID, customer, or model"
                        className="form-input pl-9"
                        value={aftersalesSearchQuery}
                        onChange={(event) => setAftersalesSearchQuery(event.target.value)}
                      />
                      <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="whitespace-nowrap rounded-md bg-primary px-6 py-2 text-white transition-colors hover:bg-primary/90"
                    onClick={() => {
                      setAftersalesSearchQuery('');
                      setAftersalesStatusFilter('all');
                    }}
                  >
                    Reset filters
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="bg-gray-50 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Ticket ID
                      </th>
                      <th className="bg-gray-50 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        {renderSortButton('Customer', 'customer', aftersalesSort, toggleAftersalesSort)}
                      </th>
                      <th className="bg-gray-50 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Device
                      </th>
                      <th className="bg-gray-50 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        {renderSortButton(
                          'Submitted at',
                          'submittedAt',
                          aftersalesSort,
                          toggleAftersalesSort,
                        )}
                      </th>
                      <th className="bg-gray-50 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        {renderSortButton(
                          'Service type',
                          'serviceType',
                          aftersalesSort,
                          toggleAftersalesSort,
                        )}
                      </th>
                      <th className="bg-gray-50 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        {renderSortButton('Status', 'status', aftersalesSort, toggleAftersalesSort)}
                      </th>
                      <th className="bg-gray-50 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {aftersalesFilteredOrders.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                          No tickets match the filters.
                        </td>
                      </tr>
                    )}
                    {aftersalesFilteredOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-primary">
                          {order.id}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">
                          {order.customer}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">
                          {order.model}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">
                          {order.submittedAt}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">
                          {order.serviceType}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2 text-xs font-semibold leading-5 ${order.statusClass}`}
                          >
                            <span className={`status-dot ${order.dotClass}`} />
                            {order.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-primary">
                          <button type="button" className="hover:underline">
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div className="text-sm text-gray-500">
                  Showing {aftersalesResultCount} of {aftersalesTotalCount} service tickets
                </div>
                <div className="flex space-x-1">
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 text-gray-400 transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
                    disabled
                  >
                    <FaChevronLeft className="text-xs" />
                  </button>
                  <button className="flex h-8 w-8 items-center justify-center rounded border border-primary bg-primary text-white">
                    1
                  </button>
                  <button className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 transition-colors hover:border-primary hover:text-primary">
                    2
                  </button>
                  <button className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 transition-colors hover:border-primary hover:text-primary">
                    3
                  </button>
                  <button className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 text-gray-400 transition-colors hover:border-primary hover:text-primary">
                    <FaChevronRight className="text-xs" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
      <footer className="bg-dark text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center text-xl font-bold text-white">
                <FaPrint className="mr-2" />
                <span>UV Integration Center</span>
              </div>
              <p className="mb-4 text-gray-400">
                Professional UV printing solutions for signage, décor, and industrial applications.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 transition-colors hover:text-white">
                  <FaWeixin className="text-xl" />
                </a>
                <a href="#" className="text-gray-400 transition-colors hover:text-white">
                  <FaWeibo className="text-xl" />
                </a>
                <a href="#" className="text-gray-400 transition-colors hover:text-white">
                  <FaYoutube className="text-xl" />
                </a>
              </div>
            </div>
            <div>
              <h3 className="mb-4 text-lg font-semibold">Products</h3>
              <ul className="space-y-2">
                {['Industrial UV printers', 'Mid-size UV printers', 'Compact UV printers', 'Desktop UV printers', 'Print supplies'].map(
                  (item) => (
                    <li key={item}>
                      <a href="#" className="text-gray-400 transition-colors hover:text-white">
                        {item}
                      </a>
                    </li>
                  ),
                )}
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-lg font-semibold">Support</h3>
              <ul className="space-y-2">
                {['Tech support', 'Aftersales service', 'FAQ', 'Video tutorials', 'Downloads'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 transition-colors hover:text-white">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-lg font-semibold">Contact us</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <FaMapMarker className="mr-3 mt-1 w-4 text-center text-gray-400" />
                  <span className="text-gray-400">101 Innovation Road, Bao'an District, Shenzhen, China</span>
                </li>
                <li className="flex items-center">
                  <FaPhone className="mr-3 w-4 text-center text-gray-400" />
                  <span className="text-gray-400">+86 400-888-9999</span>
                </li>
                <li className="flex items-center">
                  <FaEnvelope className="mr-3 w-4 text-center text-gray-400" />
                  <span className="text-gray-400">support@uv-integration.com</span>
                </li>
                <li className="flex items-center">
                  <FaClock className="mr-3 w-4 text-center text-gray-400" />
                  <span className="text-gray-400">Mon-Fri 09:00–18:00</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-gray-800 pt-6 text-center text-sm text-gray-500">
            © 2023 UV Integration Center. All rights reserved.
          </div>
        </div>
      </footer>

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 ${
          isSuccessModalOpen ? '' : 'hidden'
        }`}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            setIsSuccessModalOpen(false);
          }
        }}
      >
        <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <FaCheck className="text-2xl text-success" />
          </div>
          <h3 className="mb-2 text-xl font-bold">{modalContent.title}</h3>
          <p className="mb-6 text-gray-500">{modalContent.message}</p>
          <div className="mb-6 rounded-lg bg-gray-50 p-4">
            <p className="mb-1 text-sm text-gray-700">
              Reference ID: <span className="font-medium text-primary">{modalContent.orderNumber}</span>
            </p>
            <p className="text-sm text-gray-700">Keep this ID to check progress at any time.</p>
          </div>
          <button
            type="button"
            className="w-full rounded-md bg-primary px-6 py-2 text-white transition-colors hover:bg-primary/90"
            onClick={() => setIsSuccessModalOpen(false)}
          >
            OK
          </button>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50 ${
          isLoading ? '' : 'hidden'
        }`}
      >
        <div className="mx-4 w-full max-w-xs rounded-xl bg-white p-8 text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
          <p className="text-gray-700">Submitting data...</p>
        </div>
      </div>
    </div>
  );
};

export default BusinessIntegrationPage;
