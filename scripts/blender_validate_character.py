#!/usr/bin/env python3
"""ALTERA Hero 001: validate a Blender scene before exporting a production GLB.
Run in Blender's Scripting workspace: exec(open('scripts/blender_validate_character.py').read()).
Does not generate geometry or claim the model is finished.
"""
import bpy
import json

REQUIRED = ("Hips", "Spine", "Head", "LeftUpperArm", "RightUpperArm", "LeftUpperLeg", "RightUpperLeg")
ALIASES = {
    "Hips": ("hips", "pelvis"),
    "Spine": ("spine", "spine1"),
    "Head": ("head",),
    "LeftUpperArm": ("leftupperarm", "upperarm_l", "upperarml", "lupperarm"),
    "RightUpperArm": ("rightupperarm", "upperarm_r", "upperarmr", "rupperarm"),
    "LeftUpperLeg": ("leftupperleg", "thigh_l", "thighl", "lthigh", "leftupleg"),
    "RightUpperLeg": ("rightupperleg", "thigh_r", "thighr", "rthigh", "rightupleg"),
}

def norm(name):
    name = name.lower().split(":")[-1]
    if name.startswith("mixamorig"):
        name = name[len("mixamorig"):]
    return "".join(ch for ch in name if ch.isalnum() or ch == "_")

def inspect_scene():
    armatures = [o for o in bpy.context.scene.objects if o.type == "ARMATURE"]
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    triangles = 0
    warnings = []
    for obj in meshes:
        obj.data.calc_loop_triangles()
        triangles += len(obj.data.loop_triangles)
        if not any(m.type == "ARMATURE" for m in obj.modifiers):
            warnings.append(f"{obj.name}: missing Armature modifier")
        if not obj.vertex_groups:
            warnings.append(f"{obj.name}: no vertex groups for skin weights")
        if not obj.data.uv_layers:
            warnings.append(f"{obj.name}: missing UV map")
    bones = {norm(b.name) for arm in armatures for b in arm.data.bones}
    missing = [name for name in REQUIRED if not any(norm(alias) in bones for alias in ALIASES[name])]
    if not armatures:
        warnings.append("No armature in scene")
    if missing:
        warnings.append("Missing required humanoid bones: " + ", ".join(missing))
    if triangles > 35000:
        warnings.append("Exceeds initial mobile LOD target of 35,000 triangles")
    actions = sorted({a.name for a in bpy.data.actions})
    if not any("idle" in a.lower() for a in actions):
        warnings.append("No Idle action found")
    if not any("walk" in a.lower() for a in actions):
        warnings.append("No Walk action found")
    report = {
        "character": "altera-hero-001",
        "armatures": [a.name for a in armatures],
        "mesh_count": len(meshes),
        "triangles": triangles,
        "bone_count": len(bones),
        "missing_required_bones": missing,
        "actions": actions,
        "warnings": warnings,
        "ready_for_review": bool(armatures and meshes and not missing),
    }
    return report

report = inspect_scene()
print("ALTERA_CHARACTER_VALIDATION=" + json.dumps(report, ensure_ascii=False, indent=2))
