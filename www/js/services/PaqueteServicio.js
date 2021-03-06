var PaqueteServicio = (function () {
    function PaqueteServicio() {
    }
    PaqueteServicio.prototype.obtenerDenominacionesPorSku = function (sku, configuracionDecimales, cliente, puedeEspecificarUm, callback, callbackError) {
        this.obtenerUnidadMinimaDeVenta(sku, cliente, configuracionDecimales, function (pacUnidadMinim) {
            SONDA_DB_Session.transaction(function (tx) {
                var sql = "SELECT" +
                    " U2.PACK_UNIT" +
                    " ,C2.CODE_PACK_UNIT_FROM CODE_PACK_UNIT " +
                    " ,U2.DESCRIPTION_PACK_UNIT" +
                    " ,C2.[ORDER] PRIORITY " +
                    " ,IFNULL(IH.QTY,0) LAST_QTY" +
                    " FROM PACK_CONVERSION C1" +
                    " INNER JOIN PACK_CONVERSION C2 ON (C1.CODE_SKU = C2.CODE_SKU	AND C1.CODE_PACK_UNIT_TO = C2.CODE_PACK_UNIT_TO)" +
                    " INNER JOIN PACK_UNIT U2 ON (C2.CODE_PACK_UNIT_FROM = U2.CODE_PACK_UNIT)" +
                    " LEFT JOIN ITEM_HISTORY IH ON (C1.CODE_SKU= IH.CODE_SKU AND IH.CODE_CUSTOMER='" +
                    cliente.clientId +
                    "' AND IH.CODE_PACK_UNIT=C2.CODE_PACK_UNIT_FROM)" +
                    " WHERE C1.CODE_SKU = '" +
                    sku.sku +
                    "' " +
                    " AND C1.[ORDER] = 1" +
                    " ORDER BY C2.[ORDER] DESC";
                tx.executeSql(sql, [], function (tx, results) {
                    if (results.rows.length >= 1) {
                        var paquetes = [];
                        for (var i = 0; i < results.rows.length; i++) {
                            var stPaquete = results.rows.item(i);
                            var paquete = new Paquete();
                            paquete.packUnit = stPaquete.PACK_UNIT;
                            paquete.codePackUnit = stPaquete.CODE_PACK_UNIT;
                            paquete.descriptionPackUnit =
                                stPaquete.DESCRIPTION_PACK_UNIT;
                            paquete.priority = stPaquete.PRIORITY;
                            paquete.qty = trunc_number(0, configuracionDecimales.defaultCalculationsDecimals);
                            paquete.lastQtySold = stPaquete.LAST_QTY;
                            paquete.codeSku = sku.sku;
                            paquete.appliedDiscount = sku.appliedDiscount;
                            paquete.discountType = sku.discountType;
                            paquete.isUniqueDiscountScale = sku.isUniqueDiscountScale;
                            if (!puedeEspecificarUm) {
                                if (paquete.priority >= pacUnidadMinim.priority) {
                                    paquetes.push(paquete);
                                }
                            }
                            else {
                                paquetes.push(paquete);
                            }
                            paquete.lastCodePackUnitSold =
                                stPaquete.LAST_CODE_PACK_UNIT_SOLD;
                            paquete.lastPriceSold = stPaquete.LAST_PRICE_SOLD;
                            paquete.lastSaleDate = stPaquete.LAST_SALE_DATE;
                        }
                        callback(paquetes);
                    }
                    else {
                        var operacion = new Operacion();
                        operacion.resultado = ResultadoOperacionTipo.Error;
                        operacion.codigo = 0;
                        operacion.mensaje =
                            "Este producto no tiene paquetes configurados";
                        callbackError(operacion);
                    }
                });
            }, function (err) {
                var operacion = new Operacion();
                operacion.resultado = ResultadoOperacionTipo.Error;
                operacion.codigo = err.code;
                operacion.mensaje = err.message;
                callbackError(operacion);
            });
        }, callbackError);
    };
    PaqueteServicio.prototype.obtenerUnidadMinimaDeVenta = function (sku, cliente, configuracionDecimales, callback, callbackError) {
        SONDA_DB_Session.transaction(function (tx) {
            var sql = "SELECT PC.*  FROM PACK_CONVERSION PC INNER JOIN PRICE_LIST_BY_SKU_PACK_SCALE PL ON (PC.CODE_PACK_UNIT_FROM = PL.CODE_PACK_UNIT AND  PC.CODE_SKU= PL.CODE_SKU)" +
                " WHERE PC.CODE_SKU ='" +
                sku.sku +
                "'" +
                " AND (PL.CODE_PRICE_LIST ='" +
                cliente.priceListId +
                "' OR PL.CODE_PRICE_LIST ='" +
                cliente.priceListId +
                "') ";
            tx.executeSql(sql, [], function (tx, results) {
                if (results.rows.length >= 1) {
                    var stPaqueteConversion = results.rows.item(0);
                    var umPaquete = new Paquete();
                    umPaquete.packUnit = 0;
                    umPaquete.codePackUnit = stPaqueteConversion.CODE_PACK_UNIT_FROM;
                    umPaquete.descriptionPackUnit =
                        stPaqueteConversion.CODE_PACK_UNIT_FROM;
                    umPaquete.qty = 0;
                    umPaquete.price = 0;
                    umPaquete.priority = stPaqueteConversion.ORDER;
                    umPaquete.codeSku = sku.sku;
                    callback(umPaquete);
                }
                else {
                    var maxUmPaquete = new Paquete();
                    maxUmPaquete.priority = 999999;
                    callback(maxUmPaquete);
                }
            });
        }, function (err) {
            var operacion = new Operacion();
            operacion.resultado = ResultadoOperacionTipo.Error;
            operacion.codigo = err.code;
            operacion.mensaje = err.message;
            callbackError(operacion);
        });
    };
    PaqueteServicio.prototype.obtenerConversionDePaquetes = function (sku, configuracionDecimales, callback, callbackError) {
        SONDA_DB_Session.transaction(function (tx) {
            var sql = "SELECT " +
                " C1.CODE_SKU" +
                " ,C1.CODE_PACK_UNIT_TO AS CODE_PACK_UNIT_FROM" +
                " ,U1.DESCRIPTION_PACK_UNIT AS DESCRIPTION_PACK_UNIT_FR" +
                " ,C2.CODE_PACK_UNIT_FROM AS CODE_PACK_UNIT_TO" +
                " ,U2.DESCRIPTION_PACK_UNIT AS DESCRIPTION_PACK_UNIT_TO" +
                " ,C2.[ORDER] AS PRIORITY" +
                " ,C2.CONVERSION_FACTOR" +
                " FROM PACK_CONVERSION C1" +
                " INNER JOIN PACK_CONVERSION C2 ON (C1.CODE_SKU = C2.CODE_SKU	AND C1.CODE_PACK_UNIT_TO = C2.CODE_PACK_UNIT_TO)" +
                " INNER JOIN PACK_UNIT U1 ON (C1.CODE_PACK_UNIT_TO = U1.CODE_PACK_UNIT)" +
                " INNER JOIN PACK_UNIT U2 ON (C2.CODE_PACK_UNIT_FROM = U2.CODE_PACK_UNIT)" +
                " WHERE C1.CODE_SKU = '" +
                sku.sku +
                "' " +
                " AND C1.[ORDER] = 1" +
                " ORDER BY C2.[ORDER] DESC";
            tx.executeSql(sql, [], function (tx, results) {
                if (results.rows.length >= 1) {
                    var paqueteConfersion = [];
                    for (var i = 0; i < results.rows.length; i++) {
                        var stPaqueteConversion = results.rows.item(i);
                        var paquete = new PaqueteConversion();
                        paquete.codeSku = stPaqueteConversion.CODE_SKU;
                        paquete.codePackUnitFrom =
                            stPaqueteConversion.CODE_PACK_UNIT_FROM;
                        paquete.descriptionPackUnitFrom =
                            stPaqueteConversion.DESCRIPTION_PACK_UNIT_FROM;
                        paquete.codePackUnitTo = stPaqueteConversion.CODE_PACK_UNIT_TO;
                        paquete.descriptionPackUnitTo =
                            stPaqueteConversion.DESCRIPTION_PACK_UNIT_TO;
                        paquete.conversionFactor = trunc_number(stPaqueteConversion.CONVERSION_FACTOR, configuracionDecimales.defaultCalculationsDecimals);
                        paquete.priority = stPaqueteConversion.PRIORITY;
                        paquete.codeSku = sku.sku;
                        paqueteConfersion.push(paquete);
                    }
                    callback(paqueteConfersion);
                }
                else {
                    var operacion = new Operacion();
                    operacion.resultado = ResultadoOperacionTipo.Error;
                    operacion.codigo = 0;
                    operacion.mensaje =
                        "Este producto no tiene configurado las conversiones.";
                    callbackError(operacion);
                }
            });
        }, function (err) {
            var operacion = new Operacion();
            operacion.resultado = ResultadoOperacionTipo.Error;
            operacion.codigo = err.code;
            operacion.mensaje = err.message;
            callbackError(operacion);
        });
    };
    PaqueteServicio.prototype.obtenerConversionDePaquete = function (sku, paquetes, index, configuracionDecimales, callback, callbackError) {
        SONDA_DB_Session.transaction(function (tx) {
            var sql = "SELECT C1.CODE_SKU" +
                ", C1.CODE_PACK_UNIT_FROM" +
                ", C2.CODE_PACK_UNIT_FROM CODE_PACK_UNIT_TO" +
                ", CASE C2.CONVERSION_FACTOR WHEN 1 THEN C1.CONVERSION_FACTOR ELSE C2.CONVERSION_FACTOR END CONVERSION_FACTOR" +
                " FROM PACK_CONVERSION C1 " +
                " INNER JOIN PACK_CONVERSION C2 ON(C1.CODE_SKU = C2.CODE_SKU AND C1.[ORDER] = (C2.[ORDER] - 1))" +
                " WHERE C1.CODE_SKU = '" +
                sku.sku +
                "' AND C1.CODE_PACK_UNIT_FROM ='" +
                paquetes[index].codePackUnit +
                "' LIMIT 1";
            tx.executeSql(sql, [], function (tx, results) {
                if (results.rows.length > 0) {
                    var stPaqueteConversion = results.rows.item(0);
                    var paqueteConversion = new PaqueteConversion();
                    paqueteConversion.codeSku = stPaqueteConversion.CODE_SKU;
                    paqueteConversion.conversionFactor =
                        stPaqueteConversion.CONVERSION_FACTOR;
                    paqueteConversion.codePackUnitFrom =
                        stPaqueteConversion.CODE_PACK_UNIT_FROM;
                    paqueteConversion.codePackUnitTo =
                        stPaqueteConversion.CODE_PACK_UNIT_TO;
                    paqueteConversion.codeSku = sku.sku;
                    callback(paqueteConversion, paquetes, index);
                }
                else {
                    var operacion = new Operacion();
                    operacion.resultado = ResultadoOperacionTipo.Error;
                    operacion.codigo = 0;
                    operacion.mensaje =
                        "Este producto no tiene configurado las conversiones.";
                    callbackError(operacion);
                }
            });
        }, function (err) {
            var operacion = new Operacion();
            operacion.resultado = ResultadoOperacionTipo.Error;
            operacion.codigo = err.code;
            operacion.mensaje = err.message;
            callbackError(operacion);
        });
    };
    PaqueteServicio.prototype.obtenerDenominacionPorSku = function (sku, indiceDeLista, callback, callbackError) {
        SONDA_DB_Session.transaction(function (tx) {
            var sql = "SELECT" +
                " U2.PACK_UNIT" +
                " ,C2.CODE_PACK_UNIT_FROM CODE_PACK_UNIT " +
                " ,U2.DESCRIPTION_PACK_UNIT" +
                " ,C2.[ORDER] PRIORITY " +
                " FROM PACK_CONVERSION C1" +
                " INNER JOIN PACK_CONVERSION C2 ON (C1.CODE_SKU = C2.CODE_SKU	AND C1.CODE_PACK_UNIT_TO = C2.CODE_PACK_UNIT_TO)" +
                " INNER JOIN PACK_UNIT U2 ON (C2.CODE_PACK_UNIT_FROM = U2.CODE_PACK_UNIT)" +
                " WHERE C1.CODE_SKU = '" +
                sku.sku +
                "' " +
                " AND C1.[ORDER] = 1" +
                " ORDER BY C2.[ORDER] DESC";
            tx.executeSql(sql, [], function (tx, results) {
                if (results.rows.length >= 1) {
                    var listaPaquete = [];
                    for (var i = 0; i < results.rows.length; i++) {
                        var stPaquete = results.rows.item(i);
                        var paquete = new Paquete();
                        paquete.packUnit = stPaquete.PACK_UNIT;
                        paquete.codePackUnit = stPaquete.CODE_PACK_UNIT;
                        paquete.descriptionPackUnit = stPaquete.DESCRIPTION_PACK_UNIT;
                        paquete.priority = stPaquete.PRIORITY;
                        paquete.codeSku = sku.sku;
                        listaPaquete.push(paquete);
                    }
                    callback(listaPaquete, indiceDeLista);
                }
                else {
                    var operacion = new Operacion();
                    operacion.resultado = ResultadoOperacionTipo.Error;
                    operacion.codigo = 0;
                    operacion.mensaje =
                        "Este producto no tiene denominacion configurado.";
                    callbackError(operacion);
                }
            });
        }, function (err) {
            var operacion = new Operacion();
            operacion.resultado = ResultadoOperacionTipo.Error;
            operacion.codigo = err.code;
            operacion.mensaje = err.message;
            callbackError(operacion);
        });
    };
    PaqueteServicio.prototype.obtenerTodasLasUnidadesDeMedida = function (callback, callbackError) {
        SONDA_DB_Session.transaction(function (tx) {
            var sql = "SELECT DISTINCT";
            sql += " PU.PACK_UNIT";
            sql += " ,PU.CODE_PACK_UNIT ";
            sql += " ,PU.DESCRIPTION_PACK_UNIT";
            sql += " FROM PACK_UNIT PU";
            tx.executeSql(sql, [], function (tx1, results) {
                var listaPaquetesTemp = [];
                for (var i = 0; i < results.rows.length; i++) {
                    var paqueteTemp = results.rows.item(i);
                    var paquete = new Paquete();
                    paquete.packUnit = paqueteTemp.PACK_UNIT;
                    paquete.codePackUnit = paqueteTemp.CODE_PACK_UNIT;
                    paquete.descriptionPackUnit = paqueteTemp.DESCRIPTION_PACK_UNIT;
                    listaPaquetesTemp.push(paquete);
                }
                callback(listaPaquetesTemp);
            }, function (tx2, err) {
                if (err.code !== 0) {
                    callbackError({
                        codigo: err.code,
                        mensaje: "Error al obtener unidades de medida de skus: " + err.message
                    });
                }
            });
        }, function (err) {
            callbackError({
                codigo: err.code,
                mensaje: "Error al obtener familias de skus: " + err.message
            });
        });
    };
    return PaqueteServicio;
}());
//# sourceMappingURL=PaqueteServicio.js.map