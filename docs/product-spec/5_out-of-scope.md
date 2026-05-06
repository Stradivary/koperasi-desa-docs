# 5. Out of Scope

The following are explicitly excluded from this system. Items may be revisited in future versions.

## Payment network integrations

- No integration with Visa, Mastercard, GPN, or any interbank network.
- No EMV contactless compliance. This is a closed-loop proprietary wallet.
- No QR-code payment flows. NFC tap is the only card interaction mechanism.

## Native mobile apps

- No iOS or Android native app is in scope. All interaction is browser-based via Web NFC.
- iOS NFC write support is not available via Web NFC; no iOS write path is planned.
- A native app wrapper (e.g., Capacitor) is not in scope for v1.

## Hardware terminal certification

- The system does not target PCI-DSS terminal certification.
- No dedicated payment terminal hardware (POS devices, pinpads) is in scope. Operators use a browser on a general-purpose Android device.

## Cardholder identity & KYC

- The wallet is anonymous at the card level. There is no binding of a card to a legal identity.
- No KYC (Know Your Customer) verification is in scope.
- Lost card recovery via identity verification is not in scope; physical card reissue is the only recovery path.

## Real-time fraud alerts

- Real-time transaction monitoring and push alerts are out of scope. Fraud signals are surfaced at reconciliation time only.
- Automated card blocking triggered by fraud signals is not in scope for v1; a human operator must action the flag.

## Multi-currency

- Only a single currency (IDR / Rupiah) is supported. No foreign currency conversion or multi-currency wallets.

## Peer-to-peer transfers

- Card-to-card value transfers are not supported. All value flows are member ↔ operator (top-up / debit).

## Recurring payments & subscriptions

- No scheduled or recurring debit instructions. Every transaction is initiated by an operator tap.

## Card personalisation (printing / embossing)

- Physical card design, printing, and personalisation are out of scope.
