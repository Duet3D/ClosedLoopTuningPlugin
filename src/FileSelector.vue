<style scoped>
/* The circular progress is stepped per deleted file, so its default transition lags behind */
.disable-transition {
	transition: none !important;
}

.disable-transition :deep(.v-progress-circular__overlay) {
	transition: none;
}
</style>

<template>
	<v-card variant="flat" class="d-flex flex-column fill-height">
		<v-card-title class="d-flex align-center pt-2 pb-1">
			<v-icon size="small" class="mr-2">mdi-file-table-box-multiple</v-icon>
			{{ $t("plugins.ClosedLoopTuning.files.title") }}
			<v-spacer />
			<v-icon class="ml-2" :disabled="loading" @click="refresh">mdi-refresh</v-icon>
			<v-icon v-if="!isDeleting" class="ml-2" :disabled="files.length === 0" @click="deleteDialog = true">mdi-delete</v-icon>
			<v-progress-circular v-else class="disable-transition ml-2" size="24" :model-value="deleteProgress" />
		</v-card-title>

		<v-progress-linear :active="loading" indeterminate />

		<v-card-text class="flex-grow-1 pb-0">
			<div v-if="files.length > 200" class="text-error text-center mb-3">
				{{ $t("plugins.ClosedLoopTuning.files.tooManyFiles", [files.length]) }}<br>
				{{ $t("plugins.ClosedLoopTuning.files.tooManyFilesHint") }}
			</div>

			<v-alert v-if="files.length === 0 && !loading" type="info" variant="tonal" density="compact"
					 class="mb-0 flex-grow-0 flex-shrink-0"
					 :text="$t('plugins.ClosedLoopTuning.files.noFiles')" />

			<v-list v-else density="compact">
				<v-list-item v-for="file in displayedFiles" :key="file.name" :title="file.name"
							 :active="file.name === selectedFile" color="primary"
							 @click="select(file.name)">
					<template #append>
						<v-icon @click.stop="deleteFile(file.name)">mdi-delete</v-icon>
					</template>
				</v-list-item>
			</v-list>
		</v-card-text>

		<v-card-actions v-if="pageCount > 1">
			<v-pagination v-model="page" :length="pageCount" :total-visible="5" class="mx-auto" />
		</v-card-actions>

		<v-dialog v-model="deleteDialog" width="480" persistent>
			<v-card>
				<v-card-title>
					{{ $t("plugins.ClosedLoopTuning.files.deleteAllTitle") }}
				</v-card-title>
				<v-card-text>
					{{ $t("plugins.ClosedLoopTuning.files.deleteAllPrompt") }}
				</v-card-text>
				<v-card-actions>
					<v-spacer />
					<v-btn class="mr-1" color="error" @click="deleteAll">
						{{ $t("button.delete") }}
					</v-btn>
					<v-btn @click="deleteDialog = false">
						{{ $t("generic.cancel") }}
					</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</v-card>
</template>

<script setup lang="ts">
import { DirectoryNotFoundError, type FileListItem } from "@duet3d/connectors";
import { i18n, LogLevel, useMachineStore, useUiStore } from "DuetWebControl";
import { computed, onMounted, ref, watch } from "vue";

import { getErrorMessage } from "@/utils/errors";
import Path from "@/utils/path";

const maxFileDisplay = 13;

const emit = defineEmits<{
	fileSelect: [string | null];
}>();

const machineStore = useMachineStore();
const uiStore = useUiStore();

const page = ref(1);
const files = ref<Array<FileListItem>>([]);
const loading = ref(false);
const selectedFile = ref<string | null>(null);
const deleteDialog = ref(false);
const isDeleting = ref(false);
const deleteProgress = ref(0);

const pageCount = computed(() => Math.ceil(files.value.length / maxFileDisplay));
const displayedFiles = computed(() => files.value.slice((page.value - 1) * maxFileDisplay, page.value * maxFileDisplay));

function select(name: string) {
	selectedFile.value = (selectedFile.value === name) ? null : name;
}

async function refresh() {
	if (!machineStore.isConnected) {
		selectedFile.value = null;
		files.value = [];
		return;
	}

	if (loading.value) {
		return;
	}

	selectedFile.value = null;
	loading.value = true;
	try {
		const list = await machineStore.getFileList(Path.closedLoop);
		files.value = list.filter((file) => !file.isDirectory && file.name.endsWith(".csv")).sort((a, b) => (b.lastModified?.getTime() ?? 0) - (a.lastModified?.getTime() ?? 0));
	} catch (e) {
		files.value = [];
		if (!(e instanceof DirectoryNotFoundError)) {
			// The directory is only created by the firmware on the first recording, so a missing one is not worth reporting
			uiStore.makeNotification(LogLevel.error, i18n.global.t("plugins.ClosedLoopTuning.files.title"), getErrorMessage(e));
		}
	} finally {
		loading.value = false;
		page.value = Math.min(page.value, Math.max(pageCount.value, 1));
	}
}

async function selectMostRecentFile() {
	await refresh();
	page.value = 1;
	if (files.value.length > 0) {
		selectedFile.value = files.value[0].name;
	}
}

async function deleteFile(fileName: string) {
	try {
		await machineStore.delete(Path.combine(Path.closedLoop, fileName));
		await refresh();
	} catch (e) {
		uiStore.makeNotification(LogLevel.error, i18n.global.t("notification.delete.errorTitle", [fileName]), getErrorMessage(e));
	}
}

async function deleteAll() {
	deleteDialog.value = false;
	isDeleting.value = true;
	try {
		const toDelete = files.value.map((file) => file.name);
		for (let i = 0; i < toDelete.length; i++) {
			deleteProgress.value = (i / toDelete.length) * 100;
			try {
				await machineStore.delete(Path.combine(Path.closedLoop, toDelete[i]));
			} catch (e) {
				uiStore.makeNotification(LogLevel.error, i18n.global.t("notification.delete.errorTitle", [toDelete[i]]), getErrorMessage(e));
			}
		}
		await refresh();
	} finally {
		isDeleting.value = false;
		deleteProgress.value = 0;
	}
}

onMounted(() => refresh());

watch(selectedFile, (to) => emit("fileSelect", (to !== null) ? Path.combine(Path.closedLoop, to) : null));

watch(() => machineStore.isConnected, () => refresh());

defineExpose({ selectMostRecentFile });
</script>
