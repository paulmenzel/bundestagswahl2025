import fs from "fs";
import csv from "csv-parser";
import { defaultResult, type ResultType } from "./scrape";
import { getIdFromResult, saveResults } from "./wahlbezirke";

const data = fs.readFileSync(__dirname + "/data/Thüringen.csv");

const parteien = [
	"afd",
	"spd",
	"cdu",
	"linke",
	"fdp",
	"grüne",
	"freie wähler",
	"volt",
	"mlpd",
	"bündnis deutschland",
	"bsw",
	"einzelbewerber",
];

const parser = csv({
	skipLines: 4,
	separator: ";",
	headers: [
		"stand",
		"satzart",
		"wahlkreisNr",
		"kreisNr",
		"gemeindeNr",
		"wahlbezirkNr",
		"name",
		"Gemeinde mit eigenem Briefwahlbezirk",
		"abgebend nach Gemeinde/Wahlbezirk",
		"aufnehmend von Gemeinde/Wahlbezirk",
		"insgesamt_anzahl_wahlbezirke",
		"erfasste_anzahl_wahlbezirke",
		"wahlberechtigte",
		"wähler",
		"wahlbeteiligung",
		"erststimmen_ungültig",
		"erststimmen_gültig",
		"zweitstimmen_ungültig",
		"zweitstimmen_gültig",
		// parteien: afd, spd, cdu, linke, fdp, grüne, freie wähler, volt, mlpd, bündnis deutschland, bsw, einzelbewerber
		"erststimmen_afd_absolut",
		"erststimmen_afd_prozent",
		"zweitstimmen_afd_absolut",
		"zweitstimmen_afd_prozent",

		"erststimmen_spd_absolut",
		"erststimmen_spd_prozent",
		"zweitstimmen_spd_absolut",
		"zweitstimmen_spd_prozent",

		"erststimmen_cdu_absolut",
		"erststimmen_cdu_prozent",
		"zweitstimmen_cdu_absolut",
		"zweitstimmen_cdu_prozent",

		"erststimmen_linke_absolut",
		"erststimmen_linke_prozent",
		"zweitstimmen_linke_absolut",
		"zweitstimmen_linke_prozent",

		"erststimmen_fdp_absolut",
		"erststimmen_fdp_prozent",
		"zweitstimmen_fdp_absolut",
		"zweitstimmen_fdp_prozent",

		"erststimmen_grüne_absolut",
		"erststimmen_grüne_prozent",
		"zweitstimmen_grüne_absolut",
		"zweitstimmen_grüne_prozent",

		"erststimmen_freie_wähler_absolut",
		"erststimmen_freie_wähler_prozent",
		"zweitstimmen_freie_wähler_absolut",
		"zweitstimmen_freie_wähler_prozent",

		"erststimmen_volt_absolut",
		"erststimmen_volt_prozent",
		"zweitstimmen_volt_absolut",
		"zweitstimmen_volt_prozent",

		"erststimmen_mlpd_absolut",
		"erststimmen_mlpd_prozent",
		"zweitstimmen_mlpd_absolut",
		"zweitstimmen_mlpd_prozent",

		"erststimmen_bündnis_deutschland_absolut",
		"erststimmen_bündnis_deutschland_prozent",
		"zweitstimmen_bündnis_deutschland_absolut",
		"zweitstimmen_bündnis_deutschland_prozent",

		"erststimmen_bsw_absolut",
		"erststimmen_bsw_prozent",
		"zweitstimmen_bsw_absolut",
		"zweitstimmen_bsw_prozent",

		"erststimmen_einzelbewerber_absolut",
		"erststimmen_einzelbewerber_prozent",
		"zweitstimmen_einzelbewerber_absolut",
		"zweitstimmen_einzelbewerber_prozent",
	],
});

const results = [] as ResultType[];

const wahlkreise = {} as Record<string, string>;
const gemeinden = {} as Record<string, string>;

parser.on("data", (data) => {
	const { wahlkreisNr, kreisNr, gemeindeNr, wahlbezirkNr, name } = data as Record<string, string>;

	if (wahlkreisNr !== "000" && kreisNr === "00" && gemeindeNr === "000" && wahlbezirkNr === "0000") {
		wahlkreise[wahlkreisNr] = name;
	} else if (gemeindeNr !== "000" && wahlbezirkNr === "0000") {
		gemeinden[gemeindeNr] = name;
	}

	const wahlkreisName = wahlkreise[wahlkreisNr];
	const gemeindeName = gemeinden[gemeindeNr];

	if (wahlbezirkNr === "0000" || gemeindeNr === "000") return;

	const result = defaultResult();
	results.push(result);

	result.bundesland_id = "16";
	result.bundesland_name = "Thüringen";

	result.wahlkreis_id = wahlkreisNr;
	result.wahlkreis_name ||= wahlkreisName;

	result.kreis_id = kreisNr;
	// kreis name is not in data source

	result.gemeinde_id = gemeindeNr;
	result.gemeinde_name ||= gemeindeName;

	result.wahlbezirk_id = wahlbezirkNr;
	result.wahlbezirk_name = name;

	result.anzahl_berechtigte = Number(data.wahlberechtigte) || 0;
	result.anzahl_wähler = Number(data.wähler) || 0;

	parteien.forEach((partei) => {
		const erststimmen = Number(data[`erststimmen_${partei}_absolut`]) || 0;
		const zweitstimmen = Number(data[`zweitstimmen_${partei}_absolut`]) || 0;

		result.erststimmen.parteien[partei] = erststimmen;
		result.zweitstimmen.parteien[partei] = zweitstimmen;
	});

	result.erststimmen.gültig = Number(data.erststimmen_gültig) || 0;
	result.zweitstimmen.gültig = Number(data.zweitstimmen_gültig) || 0;
	result.erststimmen.ungültig = Number(data.erststimmen_ungültig) || 0;
	result.zweitstimmen.ungültig = Number(data.zweitstimmen_ungültig) || 0;
});

parser.on("end", () => {
	saveResults(results);
});

parser.write(data);
parser.end();
