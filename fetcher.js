"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const html_entities_1 = require("html-entities");
const parseArticle_1 = __importDefault(require("./parsers/parseArticle"));
require('dotenv').config();
const XmlEntity = new html_entities_1.XmlEntities();
const HTMLEntity = new html_entities_1.AllHtmlEntities();
const baseUrl = process.env.BASEURL;
const authorMapper = ({ display_name, user_id, profile_picture }) => ({
    id: user_id,
    name: display_name,
    profilePictureUrl: `https://www.gazzine.com${profile_picture}`,
});
const categoryMapper = (category) => ({
    id: category.id,
    name: XmlEntity.decode(category.name),
});
const dateMapper = (date) => date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
});
const articleMapper = (data) => {
    const { id, slug, modified, title: { rendered: title }, coauthors, _embedded: { 'wp:term': categories }, _embedded: { 'wp:featuredmedia': images }, } = data;
    return {
        id,
        slug,
        category: categories[0].map((cat) => categoryMapper(cat)),
        modified: dateMapper(new Date(modified)),
        title: XmlEntity.decode(title),
        authors: (coauthors || []).map((author) => authorMapper(author)),
        image: images[0].media_details.sizes.medium.source_url,
    };
};
const addBody = (data) => (Object.assign(Object.assign({}, articleMapper(data)), { body: parseArticle_1.default(HTMLEntity.decode(data.content.rendered.trim())) }));
exports.fetchAllPosts = ({ page, category, author }) => __awaiter(void 0, void 0, void 0, function* () {
    const url = `${baseUrl}posts?page=${page}&categories=${category || ''}&author=${author || ''}&_embed`;
    try {
        const { data } = yield axios_1.default.get(url);
        const result = data.map((article) => articleMapper(article));
        return Promise.resolve(result);
    }
    catch (error) {
        return Promise.reject(error);
    }
});
exports.fetchSinglePost = (slug) => __awaiter(void 0, void 0, void 0, function* () {
    const newSlug = encodeURI(slug);
    try {
        const { data } = yield axios_1.default.get(`${baseUrl}posts/?slug=${newSlug}&_embed`);
        const result = addBody(data[0]);
        return Promise.resolve(result);
    }
    catch (error) {
        return Promise.reject(error);
    }
});
exports.fetchOnSearch = ({ page = 1, search }) => __awaiter(void 0, void 0, void 0, function* () {
    const url = `${baseUrl}posts?page=${page}&search=${search}&_embed`;
    try {
        const { data } = yield axios_1.default.get(url);
        const result = data.map((article) => articleMapper(article));
        return Promise.resolve(result);
    }
    catch (error) {
        return Promise.reject(error);
    }
});
