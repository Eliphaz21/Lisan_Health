{{/*
Expand the name of the chart.
*/}}
{{- define "lisan-health.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "lisan-health.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "lisan-health.labels" -}}
helm.sh/chart: {{ include "lisan-health.name" . }}-{{ .Chart.Version | replace "+" "_" }}
{{ include "lisan-health.selectorLabels" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: lisan-health-platform
{{- end }}

{{/*
Selector labels
*/}}
{{- define "lisan-health.selectorLabels" -}}
app.kubernetes.io/name: {{ include "lisan-health.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
