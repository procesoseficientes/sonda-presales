var FacturaEncabezado = (function () {
    function FacturaEncabezado() {
        this.invoiceNum = 0;
        this.terms = "";
        this.postedDateTime = new Date();
        this.clientId = "";
        this.clientName = "";
        this.posTerminal = "";
        this.gps = "0,0";
        this.totalAmount = 0.0;
        this.erpInvoiceId = 0;
        this.isPosted = 0;
        this.status = "";
        this.isCreditNote = 0;
        this.voidReason = "";
        this.voidNotes = "";
        this.voidInvoiceId = 0;
        this.printRequests = 0;
        this.printedCount = 0;
        this.authId = "";
        this.satSerie = "";
        this.change = 0.0;
        this.img1 = "";
        this.img2 = "";
        this.img3 = "";
        this.consignmentId = 0;
        this.isPaidConsignment = 0;
        this.initialTaskImage = "";
        this.inPlanRoute = 0;
        this.idBo = 0;
        this.isPostedValidated = 0;
        this.detailQty = 0;
        this.handleTax = 0;
        this.taxPercent = 0.0;
        this.telephoneNumber = "";
        this.comment = "";
        this.clientAddress = "";
        this.department = "";
        this.municipality = "";
        this.nit = "";
        this.discount = 0;
        this.dueDate = new Date();
        this.creditAmount = 0.0;
        this.cashAmount = 0.0;
        this.paidToDate = 0;
        this.taskId = 0;
        this.goalHeaderId = 0;
        this.isFromDeliveryNote = "";
        this.felData = new DatosFelParaFactura();
    }
    return FacturaEncabezado;
}());
//# sourceMappingURL=FacturaEncabezado.js.map