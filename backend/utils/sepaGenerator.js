/**
 * SEPA XML Generator (ISO 20022 PAIN.001.001.03)
 * Simplified implementation for Tunisian companies
 */
const generateSEPAXML = (payrolls, companyData) => {
    const timestamp = new Date().toISOString().replace(/\.[0-9]+Z$/, '');
    const msgId = `PAY-${Date.now()}`;
    const totalAmount = payrolls.reduce((sum, p) => sum + Number(p.net_salary || 0), 0).toFixed(2);
    const count = payrolls.length;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${msgId}</MsgId>
      <CreDtTm>${timestamp}</CreDtTm>
      <NbOfTxs>${count}</NbOfTxs>
      <CtrlSum>${totalAmount}</CtrlSum>
      <InitgPty>
        <Nm>${companyData.name || 'OLYMPIA HR'}</Nm>
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>PMT-${msgId}</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <PmtTpInf>
        <SvcLvl>
          <Cd>SEPA</Cd>
        </SvcLvl>
      </PmtTpInf>
      <ReqdExctnDt>${new Date().toISOString().split('T')[0]}</ReqdExctnDt>
      <Dbtr>
        <Nm>${companyData.name || 'OLYMPIA HR'}</Nm>
      </Dbtr>
      <DbtrAcct>
        <Id>
          <IBAN>${companyData.iban || 'TN000000000000000000000'}</IBAN>
        </Id>
      </DbtrAcct>
      <DbtrAgt>
        <FinInstnId>
          <BIC>${companyData.bic || 'OLYMTNTT'}</BIC>
        </FinInstnId>
      </DbtrAgt>`;

    payrolls.forEach((p, index) => {
        xml += `
      <CdtTrfTxInf>
        <PmtId>
          <EndToEndId>ETE-${msgId}-${index}</EndToEndId>
        </PmtId>
        <Amt>
          <InstdAmt Ccy="TND">${Number(p.net_salary).toFixed(2)}</InstdAmt>
        </Amt>
        <Cdtr>
          <Nm>${p.employee_name}</Nm>
        </Cdtr>
        <CdtrAcct>
          <Id>
            <IBAN>${p.iban || 'TN000000000000000000000'}</IBAN>
          </Id>
        </CdtrAcct>
        <RmtInf>
          <Ustrd>PAYROLL ${p.month} - ${p.employee_name}</Ustrd>
        </RmtInf>
      </CdtTrfTxInf>`;
    });

    xml += `
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`;

    return xml;
};

module.exports = { generateSEPAXML };
