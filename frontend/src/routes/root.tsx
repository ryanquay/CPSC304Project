import { rem, Anchor, Text, Input, Button, Container, Divider, Group, MultiSelect, ScrollArea, Select, Stack, Table, Title, Tooltip, Center, TextInput, Flex, Modal, NumberInput, Checkbox } from "@mantine/core";
import classes from "../css/page.module.css";
import { useEffect, useState } from "react";
import cx from "clsx";
import { addSong, deleteBeatmapset, getAverageAccuracyOfPlayers, getBeatmapsetsData, getMaxAverageAccuracyFromEachModCombo, getPlayersWithAvgScoreGreaterThan, getPlayersWithScoresOnAllBeatmapsets, getTableColumns, getTableData, getTableDataWithFilter, getTableNames, updateBeatmapset } from "../services/service";
import { IconEdit, IconInfoCircle, IconSearch, IconTrash } from "@tabler/icons-react";
import '@mantine/notifications/styles.css';
import { notifications } from "@mantine/notifications";
import { BeatmapSetPOSTRequestBody, SongPUTRequestBody } from "@shared/types";
import { useForm } from "@mantine/form";

const lockedTables = ["MODIFIERSMAXAVERAGEACC", "PLAYERSAVERAGEACC", "COMPLETIONISTS", "BEATMAPSETJOINED", "PLAYERSCORE"];

const convertAttributeKeyToLabel = (key: string) => {
	return key;
}

export const Root = () => {
	const [tables ,setTables] = useState<Array<string>>([]);
	const [tableData, setTableData] = useState<Array<Object>>([]);
	const [attributes, setAttributes] = useState<Array<string>>([]);

	const [selectedTable, setSelectedTable] = useState<string>("");
	const [selectedAttributes, setSelectedAttributes] = useState<Array<string>>([]);

	const [isFiltered, setIsFiltered] = useState<boolean>(false);

	const [updateBeatmapsetOpen, setBeatmapsetOpen] = useState<boolean>(false);
	const [deleteBeatmapsetOPen, setDeleteBeatmapsetOpen] = useState<boolean>(false);
	const [bpmSearchOpen, setBpmSearchOpen] = useState<boolean>(false);
	const [addSongOpen, setAddSongOpen] = useState<boolean>(false);
	const [playerScoreSearchOpen, setPlayerScoreSearchOpen] = useState<boolean>(false);

	const [deleteBeatmapsetId, setDeleteBeatmapsetId] = useState<number>(-1);

	const addSongForm = useForm({mode: "uncontrolled"});
	const updateBeatmapsetForm = useForm({mode: "uncontrolled"});
	const bpmSearchForm = useForm({mode: "uncontrolled"});
	const filterForm = useForm({mode: "uncontrolled"});
	const playerScoreForm = useForm({mode: "uncontrolled"});

	useEffect(() => {
		const fetchTables = async () => {
			const tableNames = await getTableNames();
			setTables(tableNames);
			await handleTableChange(tableNames.includes("PLAYER") ? "PLAYER" : tableNames[0]);
		}
		fetchTables();
	}, []);

	const showErrorMessage = (title: string, message: string) => {
		notifications.show({
			title: title,
			message: message,
			color: "red",
			autoClose: false,
		})
	}

	const showSuccessMessage = (title: string, message: string) => {
		notifications.show({
			title: title,
			message: message,
			color: "green",
			autoClose: false,
		})
	}

	const handleUpdateBeatmapset = (beatmapsetData) => {
		updateBeatmapsetForm.reset();
		updateBeatmapsetForm.setFieldValue("beatmapsetId", beatmapsetData["BEATMAPSETID"]);
		updateBeatmapsetForm.setFieldValue("mapperId", beatmapsetData["MAPPERID"]);
		updateBeatmapsetForm.setFieldValue("songId", beatmapsetData["SONGID"]);
		updateBeatmapsetForm.setFieldValue("creationDate", beatmapsetData["CREATIONDATE"]);
		setBeatmapsetOpen(true);
	}

	const handleDeleteBeatmapset = (beatmapsetId: number) => {
		setDeleteBeatmapsetId(beatmapsetId);
		setDeleteBeatmapsetOpen(true);
	}

	const handleBpmSearch = async () => {
		await handleTableChange("BEATMAPSETJOINED");
		setBpmSearchOpen(false);
		bpmSearchForm.reset();
	}

	const handlePlayerScoreSearch = async () => {
		await handleTableChange("PLAYERSCORE");
		setPlayerScoreSearchOpen(false);
		playerScoreForm.reset();
	}

	const tryUpdateBeatmapset = async () => {
		const beatmapsetId = updateBeatmapsetForm.getValues()["beatmapsetId"];
		const data: BeatmapSetPOSTRequestBody = {
			mapperId: updateBeatmapsetForm.getValues()["mapperId"],
			songId: updateBeatmapsetForm.getValues()["songId"],
			creationDate: updateBeatmapsetForm.getValues()["creationDate"]
		}
		const response = await updateBeatmapset(beatmapsetId, data);
		if (!response.success) {
			showErrorMessage(response.name, response.message);
			return;
		}
		showSuccessMessage("Success", "Beatmapset updated successfully");
		setBeatmapsetOpen(false);
		handleTableChange("BEATMAPSET");
		bpmSearchForm.reset();
	}

	const tryDeleteBeatmapset = async (beatmapsetId: number) => {
		const response = await deleteBeatmapset(beatmapsetId);
		if (!response.success) {
			showErrorMessage(response.name, response.message);
			return;
		}
		showSuccessMessage("Success", "Beatmapset deleted successfully");
		setDeleteBeatmapsetOpen(false)
		handleTableChange("BEATMAPSET");
	}

	const tryAddSong = async () => {
		const data =  addSongForm.getValues();
		const requestBody: SongPUTRequestBody = {
			name: data["name"],
			bpm: data["bpm"],
			genre: data["genre"],
			artistName: data["artistName"],
			artistIsFeatured: data["artistIsFeatured"]
		}

		const response = await addSong(requestBody);
		if (!response.success) {
			showErrorMessage(response.name, response.message);
			return;
		}

		showSuccessMessage("Success", "Song added successfully");
		addSongForm.reset();
		handleTableChange("SONG");
		setAddSongOpen(false);
	}

	const handleTableChange = async (value: string | null) => {
		if (value === null) return;
		setSelectedTable(value);

		let tableColumns: string[] = [];
		let data: any = [];

		let response;
		switch (value) {
			case "MODIFIERSMAXAVERAGEACC":
				response = await getMaxAverageAccuracyFromEachModCombo();
				if(!response.success) {
					showErrorMessage(response.name, response.message);
					return;
				}
				data = response.data;
				tableColumns = [
					"MODIFIER",
					"MAXACC"
				]
				break;
			case "PLAYERSAVERAGEACC":
				response = await getAverageAccuracyOfPlayers();
				if(!response.success) {
					showErrorMessage(response.name, response.message);
					return;
				}
				data = response.data;
				tableColumns = [
					"PLAYERID",
					"NAME",
					"AVERAGEACC"
				]
				break;
			case "COMPLETIONISTS":
				response = await getPlayersWithScoresOnAllBeatmapsets();
				if(!response.success) {
					showErrorMessage(response.name, response.message);
					return;
				}
				data = response.data;
				tableColumns= [
					"PLAYERID",
					"RANK",
					"NAME",
					"JOINDATE",
					"COUNTRYNAME"
				]

				break;
			case "PLAYERSCORE":
				const minScore = playerScoreForm.getValues()["minScore"];
				response = await getPlayersWithAvgScoreGreaterThan(minScore);
				if (!response.success) {
					showErrorMessage(response.name, response.message);
					return;
				}
				data = response.data;

				tableColumns = [
					"PLAYERID",
					"NAME",
					"SCORE",
				]

				break;
			case "BEATMAPSET":
				response = await getTableColumns(value);
				if (!response.success) {
					showErrorMessage(response.name, response.message);
					return;
				}
				tableColumns = response.data;
				tableColumns.push("ACTIONS")

				response = await getTableData(value)
				if (!response.success) {
					showErrorMessage(response.name, response.message);
					return;
				}
				data = response.data;
				break;
			case "BEATMAPSETJOINED":
				const bpmAbove = bpmSearchForm.getValues()["bpmAbove"];
				const bpmBelow = bpmSearchForm.getValues()["bpmBelow"];
				console.log("bpmAbove: ", bpmAbove, "bpmBelow: ", bpmBelow);
				response = await getBeatmapsetsData(bpmAbove, bpmBelow);
				if(!response.success) {
					showErrorMessage(response.name, response.message);
					return;
				}
				data = response.data;
				tableColumns = [
					"BEATMAPSETID",
					"CREATIONDATE",
					"MAPPERID",
					"SONGID",
					"MAPPER", 
					"BPM", 
					"GENRE", 
					"SONG", 
					"ARTIST",
					"ACTIONS"
				]
				break;
			default: 
				response = await getTableColumns(value);
				if (!response.success) {
					showErrorMessage(response.name, response.message);
					return;
				}
				tableColumns = response.data;

				response = await getTableData(value)
				if (!response.success) {
					showErrorMessage(response.name, response.message);
					return;
				}
				data = response.data;
				break;
		}

		setAttributes(tableColumns);
		setSelectedAttributes(tableColumns)
		setIsFiltered(false);

		// table data is an array of values with no keys, we match attribute array index to value array index
		const formattedTableData = data.map((tuple: any) => {
			const formattedValue: { [key: string]: any } = {};		
			tableColumns.forEach((column: string, index: number) => {
				formattedValue[column] = tuple[index];
			});
			return formattedValue;
		});

		setTableData(formattedTableData);
	}

	const handleAttributeChange = async (value: string[]) => {
		if (value.length === 0) {
			showErrorMessage("Column Limit", "Cannot have less than 1 column in the table");
			return;
		}
		if(!value.includes("ACTIONS") && selectedTable === "BEATMAPSET") {
			showErrorMessage("Column Limit", "Beatmapset table must have an 'ACTIONS' column");
			return;
		}
		const response = await getTableData(selectedTable, value);

		if(!response.success) {
			showErrorMessage(response.name, response.message);
			return;
		}

		const data = response.data;
		const formattedTableData = data.map((tuple: any) => {
			const formattedValue: { [key: string]: any } = {};		
			value.forEach((column: string, index: number) => {
				formattedValue[column] = tuple[index];
			});
			return formattedValue;
		});

		setTableData(formattedTableData);
		setSelectedAttributes(value);
		setIsFiltered(false);
	}

	const handleFilterSearch = async () => {
		const filter = filterForm.getValues()["filter"];
		if (filter === "") {
			await handleTableChange(selectedTable);
		}

		const response = await getTableDataWithFilter(selectedTable, filter);

		if(!response.success) {
			showErrorMessage(response.name, response.message);
			return;
		}

		setTableData(response.data);
		setSelectedAttributes(attributes);
		setIsFiltered(true);
	}

  const rows = tableData.map((element) => (
    <Table.Tr>
			{Object.entries(element).map(([key, attribute]) => {
				if ((selectedTable === "BEATMAPSET" || selectedTable === "BEATMAPSETJOINED") && key === "BEATMAPSETID") {
					return (
						<Table.Td>
							<Anchor href={`https://osu.ppy.sh/beatmapsets/${attribute}`} target="_blank">{attribute}</Anchor>
						</Table.Td>
					)
				} else if ((selectedTable === "BEATMAPSET" || selectedTable === "BEATMAPSETJOINED") && key === "ACTIONS") {
					return (
						<Table.Td>
							<Group>
								<Button size="xs" variant="light" color="pink" onClick={() => handleUpdateBeatmapset(element)}>
									<IconEdit />
								</Button>
								<Button size="xs" variant="light" color="pink" onClick={() => handleDeleteBeatmapset(element["BEATMAPSETID"])}>
									<IconTrash />
								</Button>
							</Group>
						</Table.Td>
					)
	 			} else if (key === "AVERAGEACC" || key === "MAXACC" || key === "ACCURACY") {
					return <Table.Td>{attribute ? attribute.toFixed(2) + "%" : "N/A"}</Table.Td>
			 	} else if (key === "FLAG") {
					return <Table.Td>WIP</Table.Td>
				} else if (key === "SCORE") {
					return <Table.Td>{attribute ? attribute.toFixed(0) : "N/A"}</Table.Td>
				}
				return <Table.Td>{attribute}</Table.Td>
			})}
    </Table.Tr>
  ));

  return (
    <Container className={classes.page}>
			{/* MODALS */}
      <Modal 
				opened={playerScoreSearchOpen} 
				onClose={() => setPlayerScoreSearchOpen(false)} 
				title={<Title order={3} className={classes.title}>{"Filter Players By Min Average Score:"}</Title>}
				centered
			>
				<Stack>
					<Input.Wrapper label="Min Score:" style={{ display: 'flex', alignItems: 'center', }} labelProps={{ outerWidth: 100 }} >
						<NumberInput style={{ marginLeft: 10, width: "80%" }} key={playerScoreForm.key("minScore")} {...playerScoreForm.getInputProps("minScore")} />
					</Input.Wrapper>
					<Flex columnGap={20} style={{paddingTop: 20}} justify={"flex-end"}>
						<Button size="sm" variant="light" color="red" onClick={() => setPlayerScoreSearchOpen(false)}>Cancel</Button>
						<Button size="sm" variant="light" color="pink" onClick={() => handlePlayerScoreSearch()}>Yes</Button>
					</Flex>
				</Stack>
      </Modal>

      <Modal 
				opened={bpmSearchOpen} 
				onClose={() => setBpmSearchOpen(false)} 
				title={<Title order={3} className={classes.title}>{"Search Beatmapsets for BPM:"}</Title>}
				centered
			>
				<Stack>
					<Input.Wrapper label="Min BPM:" style={{ display: 'flex', alignItems: 'center', }} labelProps={{ outerWidth: 100 }} >
						<NumberInput style={{ marginLeft: 10, width: "80%" }} key={bpmSearchForm.key("bpmAbove")} {...bpmSearchForm.getInputProps("bpmAbove")} />
					</Input.Wrapper>
					<Input.Wrapper label="Max BPM:" style={{ display: 'flex', alignItems: 'center', }} labelProps={{ outerWidth: 100 }} >
						<NumberInput style={{ marginLeft: 10, width: "80%" }} key={bpmSearchForm.key("bpmBelow")} {...bpmSearchForm.getInputProps("bpmBelow")} />
					</Input.Wrapper>
					<Flex columnGap={20} style={{paddingTop: 20}} justify={"flex-end"}>
						<Button size="sm" variant="light" color="red" onClick={() => setBpmSearchOpen(false)}>Cancel</Button>
						<Button size="sm" variant="light" color="pink" onClick={() => handleBpmSearch()}>Yes</Button>
					</Flex>
				</Stack>
      </Modal>

      <Modal 
				opened={updateBeatmapsetOpen} 
				onClose={() => setBeatmapsetOpen(false)} 
				title={<Title order={3} className={classes.title}>{"Updating Beatmapset: " + updateBeatmapsetForm.getValues()["beatmapsetId"]}</Title>}
				centered
			>
				<Stack>
					<Input.Wrapper label="Mapper ID:" style={{ display: 'flex', alignItems: 'center', }}>
						<NumberInput style={{ marginLeft: 10, width: "70%" }} {...updateBeatmapsetForm.getInputProps("mapperId")} key={updateBeatmapsetForm.key("mapperId")} />
					</Input.Wrapper>
					<Input.Wrapper label="Song ID:" style={{ display: 'flex', alignItems: 'center', }}>
						<NumberInput style={{ marginLeft: 10, width: "70%" }} {...updateBeatmapsetForm.getInputProps("songId")} key={updateBeatmapsetForm.key("songId")} />
					</Input.Wrapper>
					<Input.Wrapper label="Creation Date:" style={{ display: 'flex', alignItems: 'center', }}>
						<TextInput style={{ marginLeft: 10, width: "70%" }} {...updateBeatmapsetForm.getInputProps("creationDate")} key={updateBeatmapsetForm.key("creationDate")} />
					</Input.Wrapper>
					<Flex columnGap={20} style={{paddingTop: 20}} justify={"flex-end"}>
						<Button size="sm" variant="light" color="red" onClick={() => setBeatmapsetOpen(false)}>Cancel</Button>
						<Button size="sm" variant="light" color="pink" onClick={() => tryUpdateBeatmapset()}>Yes</Button>
					</Flex>
				</Stack>
      </Modal>
				
      <Modal 
				opened={deleteBeatmapsetOPen} 
				onClose={() => setDeleteBeatmapsetOpen(false)} 
				title={<Title order={3} className={classes.title}>{"Deleting Beatmapset: " + deleteBeatmapsetId}</Title>}
				centered
			>
				<Text>Are you sure you want to delete this beatmapset?</Text>
				<Flex columnGap={20} style={{paddingTop: 20}} justify={"flex-end"}>
					<Button size="sm" variant="light" color="red" onClick={() => setDeleteBeatmapsetOpen(false)}>Cancel</Button>
					<Button size="sm" variant="light" color="pink" onClick={() => tryDeleteBeatmapset(deleteBeatmapsetId)}>Yes</Button>
				</Flex>
      </Modal>

      <Modal 
				opened={addSongOpen} 
				onClose={() => setAddSongOpen(false)} 
				title={<Title order={3} className={classes.title}>{"Create New Song:"}</Title>}
				centered
			>
				<Stack>
					<Input.Wrapper label="Name" style={{ display: 'flex', alignItems: 'center', }}>
						<TextInput style={{ marginLeft: 10, width: "70%" }} {...addSongForm.getInputProps("name")} key={addSongForm.key("name")} />
					</Input.Wrapper>
					<Input.Wrapper label="BPM:" style={{ display: 'flex', alignItems: 'center', }}>
						<NumberInput style={{ marginLeft: 10, width: "70%" }} {...addSongForm.getInputProps("bpm")} key={addSongForm.key("bpm")} />
					</Input.Wrapper>
					<Input.Wrapper label="Genre:" style={{ display: 'flex', alignItems: 'center', }}>
						<TextInput style={{ marginLeft: 10, width: "70%" }} {...addSongForm.getInputProps("genre")} key={addSongForm.key("genre")} />
					</Input.Wrapper>
					<Input.Wrapper label="Artist Name:" style={{ display: 'flex', alignItems: 'center', }}>
						<TextInput style={{ marginLeft: 10, width: "70%" }} {...addSongForm.getInputProps("artistName")} key={addSongForm.key("artistName")} />
					</Input.Wrapper>
					<Input.Wrapper label="Featured Artist?:" style={{ display: 'flex', alignItems: 'center', }}>
						<Checkbox style={{ marginLeft: 10, width: "70%" }} {...addSongForm.getInputProps("artistIsFeatured")} key={addSongForm.key("artistIsFeatured")} />
					</Input.Wrapper>
					<Flex columnGap={20} style={{paddingTop: 20}} justify={"flex-end"}>
						<Button size="sm" variant="light" color="red" onClick={() => setAddSongOpen(false)}>Cancel</Button>
						<Button size="sm" variant="light" color="pink" onClick={tryAddSong}>Yes</Button>
					</Flex>
				</Stack>
      </Modal>

			{/* TITLE */}
      <Title order={2} className={classes.title}>threeohfour!</Title>

			<Divider 
				label={<Title order={3}>Search</Title>}
				labelPosition="left" 
				className={classes.divider} 
			/>

			{/* TABLE SELECTION */}
			<Stack>
				<Select
					label={"Select Table:"}
					data={tables as any}
					size="sm"
					clearable={false}
					styles={{ 
						root: { display: 'flex', alignItems: 'center' }, 
						wrapper: { marginLeft: 10, minWidth: 400 },
						label: { width: 120 }
					}}
					value={selectedTable}
					onChange={handleTableChange}
				/>
				<MultiSelect
					label={"Select Columns:"}
					data={attributes as any}
					styles={{ 
						root: { display: 'flex', alignItems: 'center' }, 
						wrapper: { marginLeft: 10, minWidth: 400 },
						label: { width: 120 }
					}}
					clearable={false}
					size="sm"
					min={1}
					value={selectedAttributes}
					disabled={lockedTables.includes(selectedTable) || isFiltered}
					onChange={handleAttributeChange}
				/>
			</Stack>

			<Divider 
				label={<Title order={3}>Filter</Title>}
				labelPosition="left" 
				className={classes.divider} 
			/>

			{/* QUERY PARAMETERS */}
			<Group gap="sm">
				<Input.Wrapper
					style={{
						display: 'flex',
						alignItems: 'center',
						width: "100%",
					}}
				>
					<TextInput 
						style={{ marginLeft: 10, marginRight: 20, width: "100%"}}
						size="sm"
						placeholder={"Enter filter..."}
						disabled={lockedTables.includes(selectedTable)}
						key={filterForm.key("filter")}
						rightSection={
							<Tooltip
								label={
									<Stack>
										<Text>Filter tables by entering 'COLUMN_NAME == VALUE</Text>
										<Text>Use ' || ' for "or" conditions, and ' && ' for "and" conditions.</Text>
										<Text>Wrap text values in single quotes, like 'COLUMN == 'example'.</Text>
										<Text>{"Example: 'ARTISTID>30&&NAME=='Camellia'"}</Text>
									</Stack>
								}

								multiline
								withArrow
								transitionProps={{ transition: 'pop-bottom-right' }}
							>
								<Text component="div" c="dimmed" style={{ cursor: 'help' }}>
									<Center>
										<IconInfoCircle style={{ width: rem(18), height: rem(18) }} stroke={1.5} />
									</Center>
								</Text>
							</Tooltip>						}
						{...filterForm.getInputProps("filter")}
					/>
					<Button 
						size="sm" 
						variant="light" 
						color="pink" 
						onClick={handleFilterSearch}
						disabled={lockedTables.includes(selectedTable)}
					>
						<IconSearch />
					</Button>
					</Input.Wrapper>
				</Group>

				{
					["SCORE", "PLAYER", "BEATMAPSET", "BEATMAPSETJOINED", "SONG"].includes(selectedTable) ? (
						<>
							<Divider 
								label={<Title order={3}>Special Operations</Title>}
								labelPosition="left" 
								className={classes.divider} 
							/>
							{
							selectedTable == "SCORE" ? 
								<Button size="sm" variant="light" color="pink" onClick={() => handleTableChange("MODIFIERSMAXAVERAGEACC")}>
									Modifier with Highest Avg Accuracy
								</Button>
								: null
							}
							{
							selectedTable == "SONG" ? 
								<Button size="sm" variant="light" color="pink" onClick={() => setAddSongOpen(true)}>
									Add Song
								</Button>
								: null
							}
							{
							selectedTable == "PLAYER" ? 
								<Flex columnGap={20}>
									<Button size="sm" variant="light" flex={1} color="pink" onClick={() => setPlayerScoreSearchOpen(true)}>
										Players with Avg Score Greater Than
									</Button>
									<Button size="sm" variant="light" flex={1} color="pink" onClick={() => handleTableChange("PLAYERSAVERAGEACC")}>
										Average Accuracy Per Player
									</Button>
									<Button size="sm" variant="light" flex={1} color="pink" onClick={() => handleTableChange("COMPLETIONISTS")}>
										Players That have Played All Beatmapsets
									</Button>
								</Flex>
								: null
							}
							{
							selectedTable == "BEATMAPSET" || selectedTable == "BEATMAPSETJOINED"? 
								<Flex columnGap={20}>
									<Button size="sm" variant="light" color="pink" onClick={() => handleTableChange("BEATMAPSETJOINED")}>
										Show Special Beatmap View
									</Button>
									<Button size="sm" variant="light" flex={1} color="pink" onClick={() => setBpmSearchOpen(true)}>
										BPM Search
									</Button>
								</Flex>
								: null
							}
						</>
					) : null
				}

			<Divider 
				label={<Title order={3}>Table</Title>}
				labelPosition="left" 
				className={classes.divider} 
			/>

			{/* TABLE */}
			<ScrollArea h={400} style={{height: 400}}>
				<Table className={classes.table}>
					<Table.Thead className={cx(classes.tableHeader)}>						
							<Table.Tr>
							{selectedAttributes.map((attribute) => (
								<Table.Th>{convertAttributeKeyToLabel(attribute)}</Table.Th>
							))}
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>{rows}</Table.Tbody>
				</Table>  
			</ScrollArea>

			<Divider 
				labelPosition="left" 
				className={classes.divider} 
			/>

			{/* QUICK TABLE LINKS */}
			<Group style={{ alignItems: "center", textAlign: "center"}}>
				<Anchor className={classes.link} underline="always" onClick={() => handleTableChange("BEATMAPSET")}>
					beatmapsets
				</Anchor>
				<Anchor className={classes.link} underline="always" onClick={() => handleTableChange("PLAYER")}>
					players
				</Anchor>
				<Anchor className={classes.link} underline="always" onClick={() => handleTableChange("SCORE")}>
					scores
				</Anchor>
				<Anchor className={classes.link} underline="always" onClick={() => handleTableChange("SONG")}>
					song
				</Anchor>
			</Group>

    </Container>
  );
}

export default Root;
