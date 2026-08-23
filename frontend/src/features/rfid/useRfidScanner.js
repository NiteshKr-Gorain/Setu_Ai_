import { useEffect, useRef, useState, useCallback } from 'react';
import { scanRfidTag } from './api/rfidApi';

/**
 * Custom React Hook for Listening to Physical & Virtual RFID Scans.
 * Supports:
 *  1. Physical USB / Keyboard Wedge RFID Readers (buffered keypresses ending in Enter)
 *  2. Web NFC API (when available on supported Android / Chrome devices)
 *  3. Simulated / Manual UI scans
 *
 * @param {Object} options
 * @param {Function} options.onScanResult - Callback invoked with scan result
 * @param {boolean} options.enabled - Whether hardware listener is active
 */
export function useRfidScanner({ onScanResult, enabled = true } = {}) {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedTag, setLastScannedTag] = useState(null);
  const [nfcSupported, setNfcSupported] = useState(false);
  const [isNfcActive, setIsNfcActive] = useState(false);
  const [error, setError] = useState(null);

  const bufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);

  // Function to execute scan against backend
  const handleTagScan = useCallback(
    async (tagUid, readerType = 'hardware_reader') => {
      if (!tagUid || typeof tagUid !== 'string') return;
      const cleanUid = tagUid.trim().toUpperCase();
      if (!cleanUid) return;

      setIsScanning(true);
      setError(null);
      setLastScannedTag(cleanUid);

      try {
        const result = await scanRfidTag(cleanUid, 'village-kiosk-hub', readerType);
        if (onScanResult) {
          onScanResult(result);
        }
        return result;
      } catch (err) {
        console.error('RFID Scan Error:', err);
        setError(err.message || 'Failed to process RFID tag');
        const fallbackResult = {
          status: 'unregistered',
          action: 'bind_prompt',
          tag_uid: cleanUid,
          label: 'Unregistered / Offline Tag',
          message: err.message || `RFID Tag '${cleanUid}' could not be resolved.`,
          scanned_at: new Date().toISOString(),
        };
        if (onScanResult) {
          onScanResult(fallbackResult);
        }
        return fallbackResult;
      } finally {
        setIsScanning(false);
      }
    },
    [onScanResult]
  );

  // 1. Physical Keyboard Wedge RFID Reader Listener
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      // Ignore key events if focused in an editable text input or textarea
      const targetTag = e.target?.tagName?.toLowerCase();
      const isInput = targetTag === 'input' || targetTag === 'textarea' || e.target?.isContentEditable;
      if (isInput && !e.target?.dataset?.rfidInput) {
        return;
      }

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      // RFID scanners type characters extremely fast (<60ms apart)
      if (timeDiff > 100) {
        // Human typing or delay, reset buffer
        bufferRef.current = '';
      }

      if (e.key === 'Enter') {
        const potentialTag = bufferRef.current.trim();
        bufferRef.current = '';
        if (potentialTag.length >= 3) {
          e.preventDefault();
          handleTagScan(potentialTag, 'usb_wedge');
        }
      } else if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleTagScan]);

  // 2. Web NFC Reader Initialization
  useEffect(() => {
    if (typeof window !== 'undefined' && 'NDEFReader' in window) {
      setNfcSupported(true);
    }
  }, []);

  const startNfcScanning = useCallback(async () => {
    if (typeof window === 'undefined' || !('NDEFReader' in window)) {
      setError('Web NFC is not supported in this browser. Use Chrome on Android or a USB RFID reader.');
      return false;
    }

    try {
      const ndef = new window.NDEFReader();
      await ndef.scan();
      setIsNfcActive(true);
      setError(null);

      ndef.onreading = (event) => {
        const serialNumber = event.serialNumber;
        if (serialNumber) {
          const formattedUid = `NFC-${serialNumber.replace(/:/g, '').toUpperCase()}`;
          handleTagScan(formattedUid, 'web_nfc');
        }
      };

      ndef.onreadingerror = () => {
        setError('Cannot read NFC tag. Please try holding the tag closer.');
      };

      return true;
    } catch (err) {
      console.warn('NFC Scan Init Failed:', err);
      setError(err.message || 'Failed to start NFC reader.');
      setIsNfcActive(false);
      return false;
    }
  }, [handleTagScan]);

  return {
    isScanning,
    lastScannedTag,
    nfcSupported,
    isNfcActive,
    error,
    scanTag: handleTagScan,
    startNfcScanning,
  };
}
