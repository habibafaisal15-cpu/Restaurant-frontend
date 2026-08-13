import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { Printer, Download, Monitor, FileText } from 'lucide-react';
import './SlipPrint.css';

const SLIP_TITLES = {
  CUSTOMER_RECEIPT: 'Customer Receipt',
  KITCHEN: 'Kitchen Ticket',
  DELIVERY: 'Delivery Slip',
};

function formatMoney(amount) {
  const num = Number(amount ?? 0);
  return `Rs ${num.toLocaleString('en-PK')}`;
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  try {
    return format(new Date(dateStr), 'MMM d, yyyy · h:mm a');
  } catch {
    return String(dateStr);
  }
}

function formatStatus(status) {
  if (!status) return '—';
  return String(status).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function SlipHeader({ settings }) {
  const showLogo = settings?.showLogo !== false;
  const showName = settings?.showName !== false;
  const showAddress = settings?.showAddress !== false;
  const showPhone = settings?.showPhone !== false;

  return (
    <header className="slip__header">
      {showLogo && settings?.logo ? (
        <img src={settings.logo} alt="" className="slip__logo" />
      ) : null}
      {showName ? (
        <p className="slip__name">{settings?.name ?? 'Restaurant'}</p>
      ) : null}
      {showAddress && settings?.address ? (
        <p className="slip__meta">{settings.address}</p>
      ) : null}
      {showPhone && settings?.phone ? (
        <p className="slip__meta">Tel: {settings.phone}</p>
      ) : null}
    </header>
  );
}

function SlipOrderMeta({ order }) {
  return (
    <>
      <hr className="slip__divider" />
      <div className="slip__row">
        <span className="slip__label">Order #</span>
        <span className="slip__value">{order?.orderNumber ?? order?.id ?? '—'}</span>
      </div>
      <div className="slip__row">
        <span className="slip__label">Date</span>
        <span className="slip__value">{formatDateTime(order?.createdAt ?? order?.placedAt)}</span>
      </div>
      {order?.status && (
        <div className="slip__row">
          <span className="slip__label">Status</span>
          <span className="slip__value">{formatStatus(order.status)}</span>
        </div>
      )}
      {order?.channel && (
        <div className="slip__row">
          <span className="slip__label">Channel</span>
          <span className="slip__value">{formatStatus(order.channel)}</span>
        </div>
      )}
      {(order?.type || order?.orderType || order?.serviceType) && (
        <div className="slip__row">
          <span className="slip__label">Type</span>
          <span className="slip__value">
            {formatStatus(order.type || order.orderType || order.serviceType)}
          </span>
        </div>
      )}
      {order?.tableNumber && (
        <div className="slip__row">
          <span className="slip__label">Table</span>
          <span className="slip__value">{order.tableNumber}</span>
        </div>
      )}
      {order?.tokenNumber && (
        <div className="slip__row">
          <span className="slip__label">Token</span>
          <span className="slip__value">{order.tokenNumber}</span>
        </div>
      )}
    </>
  );
}

function SlipCustomerInfo({ order, showAddress = false }) {
  const customer = order?.customer ?? {};
  const name = order?.customerName ?? customer?.name;
  const phone = order?.customerPhone ?? customer?.phone;
  const email = order?.customerEmail ?? customer?.email;
  const address = order?.deliveryAddress ?? customer?.address ?? order?.address;
  const table = order?.tableNumber ?? order?.table;

  if (!name && !phone && !email && !address && !table) return null;

  return (
    <>
      <hr className="slip__divider" />
      {name && (
        <div className="slip__row slip__row--bold">
          <span className="slip__label">Customer</span>
          <span className="slip__value">{name}</span>
        </div>
      )}
      {phone && (
        <div className="slip__row">
          <span className="slip__label">Phone</span>
          <span className="slip__value">{phone}</span>
        </div>
      )}
      {email && (
        <div className="slip__row">
          <span className="slip__label">Email</span>
          <span className="slip__value">{email}</span>
        </div>
      )}
      {table && (
        <div className="slip__row">
          <span className="slip__label">Table</span>
          <span className="slip__value">{table}</span>
        </div>
      )}
      {showAddress && address && (
        <div className="slip__delivery-box">
          <p className="slip__label">Delivery Address</p>
          <p className="slip__address">{address}</p>
          {order?.deliveryInstructions && (
            <p className="slip__item-note">Note: {order.deliveryInstructions}</p>
          )}
        </div>
      )}
    </>
  );
}

function SlipItems({ items = [], showPrices = true }) {
  if (!items.length) {
    return (
      <>
        <hr className="slip__divider" />
        <p style={{ textAlign: 'center' }}>No items</p>
      </>
    );
  }

  return (
    <>
      <hr className="slip__divider slip__divider--solid" />
      <div className="slip__items">
        {items.map((item, i) => {
          const qty = item.quantity ?? item.qty ?? 1;
          const name = item.name ?? item.menuItemName ?? 'Item';
          const unitPrice = item.unitPrice ?? item.price ?? 0;
          const lineTotal = item.lineTotal ?? item.total ?? unitPrice * qty;

          return (
            <div key={item.id ?? i} className="slip__item">
              <div className="slip__item-header">
                <span className="slip__item-qty">{qty}x</span>
                <span className="slip__item-name">{name}</span>
                {showPrices && (
                  <span className="slip__item-price">{formatMoney(lineTotal)}</span>
                )}
              </div>
              {(item.modifiers ?? item.options)?.map((mod, j) => (
                <p key={j} className="slip__item-mod">
                  + {typeof mod === 'string' ? mod : mod.name ?? mod.label}
                  {mod.price != null && ` (${formatMoney(mod.price)})`}
                </p>
              ))}
              {item.notes && <p className="slip__item-note">Note: {item.notes}</p>}
              {item.specialInstructions && (
                <p className="slip__item-note">Special: {item.specialInstructions}</p>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function SlipTotals({ order, settings }) {
  const taxRate = settings?.taxRate ?? order?.taxRate;
  const subtotal = order?.subtotal;
  const tax = order?.tax ?? order?.taxAmount;
  const deliveryFee = order?.deliveryFee;
  const serviceCharge = order?.serviceCharge;
  const discount = order?.discount ?? order?.discountAmount;
  const tip = order?.tip;
  const total = order?.total ?? order?.grandTotal;

  const hasTotals = [subtotal, tax, deliveryFee, serviceCharge, discount, tip, total].some(
    (v) => v != null,
  );
  if (!hasTotals) return null;

  return (
    <>
      <hr className="slip__divider" />
      <div className="slip__totals">
        {subtotal != null && (
          <div className="slip__total-row">
            <span>Subtotal</span>
            <span>{formatMoney(subtotal)}</span>
          </div>
        )}
        {tax != null && (
          <div className="slip__total-row">
            <span>Tax{taxRate != null ? ` (${taxRate}%)` : ''}</span>
            <span>{formatMoney(tax)}</span>
          </div>
        )}
        {deliveryFee != null && Number(deliveryFee) > 0 && (
          <div className="slip__total-row">
            <span>Delivery Fee</span>
            <span>{formatMoney(deliveryFee)}</span>
          </div>
        )}
        {serviceCharge != null && Number(serviceCharge) > 0 && (
          <div className="slip__total-row">
            <span>Service Charge</span>
            <span>{formatMoney(serviceCharge)}</span>
          </div>
        )}
        {discount != null && Number(discount) > 0 && (
          <div className="slip__total-row">
            <span>Discount</span>
            <span>-{formatMoney(discount)}</span>
          </div>
        )}
        {tip != null && Number(tip) > 0 && (
          <div className="slip__total-row">
            <span>Tip</span>
            <span>{formatMoney(tip)}</span>
          </div>
        )}
        {total != null && (
          <div className="slip__total-row slip__total-row--grand">
            <span>TOTAL</span>
            <span>{formatMoney(total)}</span>
          </div>
        )}
      </div>
    </>
  );
}

function SlipPayment({ order }) {
  const method = order?.paymentMethod ?? order?.payment?.method;
  const status = order?.paymentStatus ?? order?.payment?.status;

  if (!method && !status) return null;

  return (
    <>
      <hr className="slip__divider" />
      {method && (
        <div className="slip__row">
          <span className="slip__label">Payment</span>
          <span className="slip__value">{formatStatus(method)}</span>
        </div>
      )}
      {status && (
        <div className="slip__row">
          <span className="slip__label">Payment Status</span>
          <span className="slip__value">{formatStatus(status)}</span>
        </div>
      )}
    </>
  );
}

function SlipFooter({ settings }) {
  const footer = settings?.footer ?? settings?.receiptFooter;
  if (!footer) return null;

  return (
    <>
      <hr className="slip__divider" />
      <footer className="slip__footer">{footer}</footer>
    </>
  );
}

function CustomerReceiptContent({ order, settings }) {
  return (
    <>
      <SlipHeader settings={settings} />
      <p className="slip__title">{SLIP_TITLES.CUSTOMER_RECEIPT}</p>
      <SlipOrderMeta order={order} />
      <SlipCustomerInfo order={order} />
      <SlipItems items={order?.items} showPrices />
      <SlipTotals order={order} settings={settings} />
      <SlipPayment order={order} />
      {order?.notes && (
        <>
          <hr className="slip__divider" />
          <div className="slip__row">
            <span className="slip__label">Order Notes</span>
            <span className="slip__value">{order.notes}</span>
          </div>
        </>
      )}
      <SlipFooter settings={settings} />
      <p className="slip__barcode-placeholder">*{order?.orderNumber ?? order?.id ?? '0000'}*</p>
    </>
  );
}

function KitchenSlipContent({ order, settings }) {
  return (
    <>
      <div style={{ textAlign: 'center' }}>
        <span className="slip__kitchen-badge">KITCHEN</span>
      </div>
      <SlipHeader settings={settings} />
      <p className="slip__title">{SLIP_TITLES.KITCHEN}</p>
      <SlipOrderMeta order={order} />
      <SlipCustomerInfo order={order} />
      {order?.kitchenNotes && (
        <>
          <hr className="slip__divider" />
          <div className="slip__row slip__row--bold">
            <span className="slip__label">Kitchen Notes</span>
            <span className="slip__value">{order.kitchenNotes}</span>
          </div>
        </>
      )}
      {order?.specialInstructions && (
        <div className="slip__row slip__row--bold">
          <span className="slip__label">Instructions</span>
          <span className="slip__value">{order.specialInstructions}</span>
        </div>
      )}
      <SlipItems items={order?.items} showPrices={false} />
      <SlipFooter settings={settings} />
    </>
  );
}

function DeliverySlipContent({ order, settings }) {
  const rider = order?.rider ?? {};
  const riderName = order?.riderName ?? rider?.name;
  const riderPhone = order?.riderPhone ?? rider?.phone;

  return (
    <>
      <SlipHeader settings={settings} />
      <p className="slip__title">{SLIP_TITLES.DELIVERY}</p>
      <SlipOrderMeta order={order} />
      <SlipCustomerInfo order={order} showAddress />
      {(riderName || riderPhone) && (
        <>
          <hr className="slip__divider" />
          <p className="slip__label">Rider</p>
          {riderName && (
            <div className="slip__row slip__row--bold">
              <span className="slip__label">Name</span>
              <span className="slip__value">{riderName}</span>
            </div>
          )}
          {riderPhone && (
            <div className="slip__row">
              <span className="slip__label">Phone</span>
              <span className="slip__value">{riderPhone}</span>
            </div>
          )}
        </>
      )}
      <SlipItems items={order?.items} showPrices />
      <SlipTotals order={order} settings={settings} />
      <SlipPayment order={order} />
      {order?.estimatedDeliveryTime && (
        <>
          <hr className="slip__divider" />
          <div className="slip__row">
            <span className="slip__label">Est. Delivery</span>
            <span className="slip__value">{formatDateTime(order.estimatedDeliveryTime)}</span>
          </div>
        </>
      )}
      <SlipFooter settings={settings} />
    </>
  );
}

function normalizeSlipType(type) {
  const t = String(type ?? '').toUpperCase();
  if (t === 'KITCHEN' || t === 'KOT') return 'KITCHEN';
  if (t === 'DELIVERY') return 'DELIVERY';
  return 'CUSTOMER_RECEIPT';
}

function SlipContent({ order, slipType, settings }) {
  switch (normalizeSlipType(slipType)) {
    case 'KITCHEN':
      return <KitchenSlipContent order={order} settings={settings} />;
    case 'DELIVERY':
      return <DeliverySlipContent order={order} settings={settings} />;
    case 'CUSTOMER_RECEIPT':
    default:
      return <CustomerReceiptContent order={order} settings={settings} />;
  }
}

export default function SlipPreview({
  order,
  slipType = 'CUSTOMER_RECEIPT',
  settings = {},
}) {
  const [previewSize, setPreviewSize] = useState('thermal');
  const [downloading, setDownloading] = useState(false);
  const printRef = useRef(null);

  const handlePrint = () => {
    const node = printRef.current;
    if (!node) {
      window.print();
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.setAttribute('title', 'Print slip');
    Object.assign(iframe.style, {
      position: 'fixed',
      right: '0',
      bottom: '0',
      width: '0',
      height: '0',
      border: '0',
      opacity: '0',
      pointerEvents: 'none',
    });
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument;
    if (!doc) {
      iframe.remove();
      window.print();
      return;
    }

    const headStyles = [
      ...Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map((el) => el.outerHTML),
      ...Array.from(document.querySelectorAll('style')).map((el) => el.outerHTML),
    ].join('');

    doc.open();
    doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Slip — ${order?.orderNumber ?? order?.id ?? ''}</title>
  ${headStyles}
  <style>
    @page { margin: 5mm; size: auto; }
    html, body {
      margin: 0 !important;
      padding: 8px !important;
      background: #fff !important;
      color: #111 !important;
    }
    .slip-print-area {
      box-shadow: none !important;
      margin: 0 auto !important;
      color: #111 !important;
      background: #fff !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .slip-print-area--thermal { width: 80mm !important; max-width: 80mm !important; }
    .slip-print-area--a4 { width: 190mm !important; max-width: 190mm !important; }
  </style>
</head>
<body>${node.outerHTML}</body>
</html>`);
    doc.close();

    const cleanup = () => {
      setTimeout(() => iframe.remove(), 500);
    };

    const runPrint = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        window.print();
      } finally {
        cleanup();
      }
    };

    const images = Array.from(doc.images ?? []);
    if (!images.length) {
      setTimeout(runPrint, 200);
      return;
    }

    Promise.all(
      images.map(
        (img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
              }),
      ),
    ).then(() => setTimeout(runPrint, 100));
  };

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;

    setDownloading(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const isThermal = previewSize === 'thermal';
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: isThermal ? [80, Math.max(80, (canvas.height * 80) / canvas.width)] : 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      const orderNum = order?.orderNumber ?? order?.id ?? 'slip';
      pdf.save(`${slipType.toLowerCase()}-${orderNum}.pdf`);
    } catch (err) {
      console.error('PDF download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="slip-preview">
      <div className="slip-preview__toolbar no-print">
        <div className="slip-preview__toolbar-left">
          <div className="slip-preview__size-toggle">
            <button
              type="button"
              className={`slip-preview__size-btn ${previewSize === 'thermal' ? 'active' : ''}`}
              onClick={() => setPreviewSize('thermal')}
            >
              <Monitor size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              80mm
            </button>
            <button
              type="button"
              className={`slip-preview__size-btn ${previewSize === 'a4' ? 'active' : ''}`}
              onClick={() => setPreviewSize('a4')}
            >
              <FileText size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              A4
            </button>
          </div>
        </div>

        <div className="slip-preview__toolbar-right">
          <button type="button" className="btn btn-secondary btn-sm" onClick={handlePrint}>
            <Printer size={16} />
            Print
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleDownloadPdf}
            disabled={downloading}
          >
            <Download size={16} />
            {downloading ? 'Generating…' : 'Download PDF'}
          </button>
        </div>
      </div>

      <div className="slip-preview__viewport">
        <div
          ref={printRef}
          className={`slip-print-area slip-print-area--${previewSize}`}
        >
          <SlipContent order={order} slipType={slipType} settings={settings} />
        </div>
      </div>
    </div>
  );
}
