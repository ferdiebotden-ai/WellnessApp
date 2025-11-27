"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("./api");
const PORT = Number.parseInt(process.env.PORT || '8080', 10);
api_1.apiApp.listen(PORT, () => {
    console.log(`Wellness OS API listening on port ${PORT}`);
});
