import { Router } from "express";
import { getAllContactsForDM, Searchcontacts, showAllContacts } from "../controllar/ContectControllar.js";
import { verifyToken } from "../middelware/AuthMiddelware.js";

const ContectRoute = Router();

ContectRoute.post("/search-contects",verifyToken, Searchcontacts);

ContectRoute.get('/get-contact-dm',verifyToken, showAllContacts)

ContectRoute.get('/get-all-contacts-for-dm',verifyToken, getAllContactsForDM)


export default ContectRoute;
